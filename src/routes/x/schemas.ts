import { t } from "elysia";

export const XHeadersSchema = t.Optional(
  t.Object({
    "x-auth-token": t.Optional(
      t.String({
        description: "Twitter auth_token cookie. Bypasses the env variable if provided.",
        default: "",
      }),
    ),
    "x-ct0": t.Optional(
      t.String({
        description: "Twitter ct0 cookie. Bypasses the env variable if provided.",
        default: "",
      }),
    ),
  }),
);

export const WinnerSchema = t.Object({
  username: t.String({ description: "Twitter username" }),
  type: t.String({ description: "Type of winner (e.g. winner, backup)" }),
  status: t.String({ description: "Status (e.g. verified, failed)" }),
  avatarUrl: t.Optional(t.Nullable(t.String({ description: "URL to the avatar" }))),
  commentProofUrl: t.Optional(
    t.Nullable(t.String({ description: "Proof of comment if required" })),
  ),
  failReason: t.Optional(t.Nullable(t.String({ description: "Reason for failure if status is failed" }))),
});

export const AntiBotFiltersSchema = t.Object({
  mustPfp: t.Optional(t.Boolean({ description: "Must have profile picture" })),
  mustBio: t.Optional(t.Boolean({ description: "Must have bio" })),
  mustAge: t.Optional(t.Boolean({ description: "Account must have minimum age" })),
  minMonths: t.Optional(t.Number({ description: "Minimum age in months" })),
  mustActivity: t.Optional(t.Boolean({ description: "Must have minimum activity" })),
  minPosts: t.Optional(t.Number({ description: "Minimum posts required" })),
  mustComment: t.Optional(t.Boolean({ description: "Must have commented on the tweet" })),
});

export const EngagementTasksSchema = t.Object({
  mustLike: t.Optional(t.Boolean()),
  mustComment: t.Optional(t.Boolean()),
  mustFollow: t.Optional(t.Boolean()),
  followUsernames: t.Optional(t.Array(t.String())),
  mustExternal: t.Optional(t.Boolean()),
  externalUrl: t.Optional(t.Nullable(t.String())),
  extMustLike: t.Optional(t.Boolean()),
  extMustRepost: t.Optional(t.Boolean()),
  extMustComment: t.Optional(t.Boolean()),
  extMustQuote: t.Optional(t.Boolean()),
});

export const GiveawaySchema = t.Object({
  _id: t.String(),
  tweetId: t.String(),
  hostUsername: t.String(),
  hostAvatarUrl: t.Optional(t.Nullable(t.String())),
  platform: t.String(),
  mode: t.String(),
  totalParticipants: t.Number(),
  participants: t.Array(t.String()),
  enabledFeatures: t.Array(t.String()),
  engagementTasks: t.Optional(EngagementTasksSchema),
  antiBotFilters: t.Optional(AntiBotFiltersSchema),
  winners: t.Array(WinnerSchema),
  createdAt: t.Union([t.String(), t.Date()]),
});

export const InitDrawRoute = {
  headers: XHeadersSchema,
  body: t.Object({
    tweetId: t.String({ description: "The ID of the target Tweet" }),
    mode: t.Union([t.Literal("likes"), t.Literal("reposts")], {
      description: "Whether to scrape from likes or reposts",
    }),
    hostUsername: t.Optional(
      t.String({ description: "The username of the host to filter out or highlight" }),
    ),
  }),
  response: {
    200: t.Object({
      drawId: t.String(),
      tweetId: t.String(),
      mode: t.String(),
      hostUsername: t.String(),
      hostAvatarUrl: t.Optional(t.Nullable(t.String())),
      participants: t.Array(t.String()),
      totalParticipants: t.Number(),
      status: t.String(),
      winners: t.Array(WinnerSchema),
      createdAt: t.Number(),
    }),
    404: t.Object({
      error: t.String(),
    }),
  },
  detail: {
    tags: ["X (Twitter) - Scraper"],
    summary: "Initialize a Draw",
    description: "Scrape participants from a tweet and start a new draw session. Provide x-auth-token and x-ct0 in headers to override environment cookies.",
  },
};

export const VerifyCandidateRoute = {
  headers: XHeadersSchema,
  body: t.Object({
    username: t.String({ description: "The username of the candidate to verify" }),
    tweetId: t.String({ description: "The tweet ID for comment verification" }),
    config: AntiBotFiltersSchema,
  }),
  response: t.Object({
    avatarUrl: t.Nullable(t.String()),
    passedPfp: t.Boolean(),
    passedBio: t.Boolean(),
    passedAge: t.Boolean(),
    actualAgeMonths: t.Optional(t.Number()),
    passedActivity: t.Boolean(),
    actualPosts: t.Optional(t.Number()),
    passedComment: t.Boolean(),
  }),
  detail: {
    tags: ["X (Twitter) - Verification"],
    summary: "Verify a Candidate",
    description: "Verifies if a specific candidate meets the anti-bot rules.",
  },
};

export const SaveDrawRoute = {
  body: t.Object({
    drawId: t.String({ description: "The unique ID for the draw session" }),
    tweetId: t.String({ description: "The target tweet ID" }),
    hostUsername: t.String({ description: "The host's username" }),
    hostAvatarUrl: t.Optional(t.Nullable(t.String())),
    mode: t.Union([t.Literal("likes"), t.Literal("reposts")]),
    totalParticipants: t.Number(),
    participants: t.Optional(t.Array(t.String())),
    enabledFeatures: t.Optional(t.Array(t.String())),
    engagementTasks: t.Optional(EngagementTasksSchema),
    antiBotFilters: t.Optional(AntiBotFiltersSchema),
    winners: t.Array(WinnerSchema),
  }),
  response: t.Object({
    success: t.Boolean(),
  }),
  detail: {
    tags: ["X (Twitter) - Core"],
    summary: "Save Finalized Draw",
    description: "Save a finalized draw session permanently.",
  },
};

export const DrawStatusRoute = {
  response: {
    200: t.Object({
      status: t.String({ description: "'active' or 'finalized'" }),
      data: t.Optional(GiveawaySchema),
      participants: t.Optional(t.Array(t.String())),
      mode: t.Optional(t.String()),
      tweetId: t.Optional(t.String()),
      hostUsername: t.Optional(t.String()),
      hostAvatarUrl: t.Optional(t.Nullable(t.String())),
      drawId: t.Optional(t.String()),
    }),
    404: t.Object({
      error: t.String(),
    }),
  },
  detail: {
    tags: ["X (Twitter) - Core"],
    summary: "Check Draw Status",
    description: "Retrieve the current status of a draw session (active or finalized).",
  },
};

export const HistoryRoute = {
  response: t.Array(GiveawaySchema),
  detail: {
    tags: ["X (Twitter) - Discovery"],
    summary: "Global Giveaways History",
    description: "Retrieve the 20 most recent finalized X (Twitter) giveaways.",
  },
};

export const TweetHistoryRoute = {
  response: t.Array(GiveawaySchema),
  detail: {
    tags: ["X (Twitter) - Discovery"],
    summary: "Giveaways History by Tweet ID",
    description: "Retrieve the past giveaways associated with a specific tweet.",
  },
};

export const LeaderboardRoute = {
  response: t.Array(
    t.Object({
      _id: t.String(),
      avatarUrl: t.Optional(t.Nullable(t.String())),
      totalGiveaways: t.Number(),
      totalParticipants: t.Number(),
    }),
  ),
  detail: {
    tags: ["X (Twitter) - Discovery"],
    summary: "Hosts Leaderboard",
    description: "Get the top 20 hosts based on number of finalized giveaways.",
  },
};
