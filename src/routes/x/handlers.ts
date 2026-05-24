import { Giveaway } from "../../db";
import { scrapeTweet, verifyCandidate } from "../../scraper";
import {
  storeDrawSession,
  clearDrawSession,
  loadActiveSession,
} from "./helpers";
import { Static } from "elysia";
import { GiveawaySchema, WinnerSchema } from "./schemas";

type GiveawayData = Static<typeof GiveawaySchema>;
type WinnerData = Static<typeof WinnerSchema>;

export async function handleInitDraw({
  body,
  headers,
  set,
}: {
  body: { tweetId: string; mode: string; hostUsername?: string };
  headers: Record<string, string | undefined>;
  set: { status?: number | string };
}) {
  const { tweetId, mode, hostUsername: clientHost } = body;
  const authToken = headers["x-auth-token"];
  const ct0 = headers["x-ct0"];
  const customCookie = authToken && ct0 ? { authToken, ct0 } : undefined;

  const { participants, hostUsername: scrapedHost, hostAvatarUrl: scrapedHostAvatar } = await scrapeTweet(tweetId, mode as "likes" | "reposts", clientHost, customCookie);

  if (participants.length === 0) {
    set.status = 404;
    return { error: "No eligible participants found or failed to scrape." };
  }

  const finalHost = scrapedHost && scrapedHost !== "unknown" ? scrapedHost : clientHost || "unknown";
  const drawId = crypto.randomUUID();
  const hostAvatarUrl = scrapedHostAvatar || (finalHost !== "unknown" ? `https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png` : undefined);

  await storeDrawSession(
    drawId,
    tweetId,
    mode,
    participants,
    finalHost,
    hostAvatarUrl
  );

  return {
    drawId,
    tweetId,
    mode,
    hostUsername: finalHost,
    hostAvatarUrl,
    participants,
    totalParticipants: participants.length,
    status: "active",
    winners: [],
    createdAt: Date.now(),
  };
}

export async function handleDrawStatus({
  params,
  set,
}: {
  params: { id: string };
  set: { status?: number | string };
}): Promise<
  | { status: "finalized"; data: GiveawayData }
  | {
      status: "active";
      participants: string[];
      mode: string;
      tweetId: string;
      hostUsername: string;
      hostAvatarUrl?: string;
      drawId: string;
    }
  | { error: string }
> {
  const { id } = params;

  const doc = await Giveaway.findById(id);
  if (doc) {
    return { status: "finalized", data: doc.toJSON() as GiveawayData };
  }

  const session = await loadActiveSession(id);
  if (session) {
    return {
      status: "active",
      participants: session.participants as string[],
      mode: session.mode as string,
      tweetId: session.tweetId as string,
      hostUsername: session.hostUsername as string,
      hostAvatarUrl: session.hostAvatarUrl as string | undefined,
      drawId: session.drawId,
    };
  }

  set.status = 404;
  return { error: "Draw not found or expired" };
}

export async function handleSaveDraw({
  body,
}: {
  body: {
    drawId: string;
    tweetId: string;
    hostUsername: string;
    hostAvatarUrl?: string | null;
    mode: string;
    totalParticipants: number;
    participants?: string[];
    enabledFeatures?: string[];
    engagementTasks?: Record<string, unknown>;
    antiBotFilters?: Record<string, unknown>;
    winners: WinnerData[];
  };
}) {
  const {
    drawId,
    tweetId,
    hostUsername,
    hostAvatarUrl,
    mode,
    totalParticipants,
    participants,
    enabledFeatures,
    engagementTasks,
    antiBotFilters,
    winners,
  } = body;

  const giveaway = new Giveaway({
    _id: drawId,
    tweetId,
    hostUsername,
    hostAvatarUrl,
    mode,
    totalParticipants,
    participants: participants || [],
    enabledFeatures: enabledFeatures || [],
    engagementTasks,
    antiBotFilters,
    winners,
  });
  await giveaway.save();
  await clearDrawSession(drawId);

  return { success: true };
}

export async function handleHistory(): Promise<GiveawayData[]> {
  return (await Giveaway.find({ platform: "X" })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()) as unknown as GiveawayData[];
}

export async function handleTweetHistory({
  params,
}: {
  params: { tweetId: string };
}): Promise<GiveawayData[]> {
  return (await Giveaway.find({ platform: "X", tweetId: params.tweetId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()) as unknown as GiveawayData[];
}

export async function handleLeaderboard() {
  return await Giveaway.aggregate([
    { $match: { platform: "X" } },
    {
      $group: {
        _id: "$hostUsername",
        hostAvatarUrl: { $first: "$hostAvatarUrl" },
        totalGiveaways: { $sum: 1 },
        totalParticipants: { $sum: "$totalParticipants" },
      },
    },
    {
      $project: {
        _id: 1,
        avatarUrl: "$hostAvatarUrl",
        totalGiveaways: 1,
        totalParticipants: 1,
      },
    },
    { $sort: { totalGiveaways: -1 } },
    { $limit: 20 },
  ]);
}

export async function handleVerifyCandidate({
  body,
  headers,
}: {
  body: { username: string; tweetId: string; config: Record<string, unknown> };
  headers: Record<string, string | undefined>;
}) {
  const { username, tweetId, config } = body;
  const authToken = headers["x-auth-token"];
  const ct0 = headers["x-ct0"];
  const customCookie = authToken && ct0 ? { authToken, ct0 } : undefined;

  const result = await verifyCandidate(
    username,
    tweetId,
    config as import("../../scraper").VerificationConfig,
    customCookie,
  );
  return result;
}
