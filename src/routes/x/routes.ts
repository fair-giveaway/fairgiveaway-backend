import { t } from "elysia";
import {
  XHeadersSchema,
  WinnerSchema,
  AntiBotFiltersSchema,
  EngagementTasksSchema,
  GiveawaySchema,
} from "./schemas";

// ── POST /api/x/draw/init ────────────────────────────────

export const InitDrawRoute = {
  headers: XHeadersSchema,
  body: t.Object(
    {
      tweetId: t.String({
        description: "The numeric ID of the target tweet. Find it in the tweet URL: x.com/user/status/<tweetId>.",
        examples: ["1234567890123456789"],
      }),
      mode: t.Union([t.Literal("likes"), t.Literal("reposts")], {
        description: "Which engagement pool to scrape. 'likes' = users who liked the tweet, 'reposts' = users who retweeted.",
      }),
      hostUsername: t.Optional(
        t.String({
          description: "Twitter handle of the giveaway host. Used to auto-exclude the host from the participant pool. If omitted, the API attempts to detect it from the tweet author.",
          examples: ["fairgiveaway"],
        }),
      ),
    },
    { description: "Payload to start a new draw session by scraping participants from a tweet." },
  ),
  response: {
    200: t.Object(
      {
        drawId: t.String({ description: "UUID v4 identifier for this draw session.", examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
        tweetId: t.String({ description: "Echo of the input tweet ID." }),
        mode: t.String({ description: "Echo of the scraping mode used." }),
        hostUsername: t.String({ description: "Resolved host username (auto-detected or from input)." }),
        hostAvatarUrl: t.Optional(t.Nullable(t.String({ description: "Resolved host avatar URL, or null." }))),
        participants: t.Array(t.String(), { description: "List of scraped participant usernames." }),
        totalParticipants: t.Number({ description: "Count of scraped participants." }),
        status: t.String({ description: "Always 'active' for a newly initialized draw.", examples: ["active"] }),
        winners: t.Array(WinnerSchema, { description: "Empty array for a new draw." }),
        createdAt: t.Number({ description: "Unix timestamp (ms) when the draw was initialized." }),
      },
      { description: "Successfully initialized draw session with scraped participants." },
    ),
    404: t.Object(
      { error: t.String({ description: "Error message explaining why scraping failed." }) },
      { description: "No participants could be scraped from the tweet." },
    ),
  },
  detail: {
    tags: ["X (Twitter) - Scraper"],
    summary: "Initialize a Draw",
    description:
      "Scrapes all participants (likers or retweeters) from the specified tweet and creates a new ephemeral draw session stored in Redis with a 15-minute TTL.\n\n" +
      "**Authentication:** Provide `x-auth-token` and `x-ct0` headers to use your own Twitter credentials.\n\n" +
      "**Flow:** After calling this endpoint, use the returned `drawId` to:\n" +
      "1. Verify individual candidates via `POST /api/x/verify`\n" +
      "2. Check session status via `GET /api/x/draw/status/:id`\n" +
      "3. Save the finalized draw via `POST /api/x/draw/save`",
  },
};

// ── POST /api/x/verify ──────────────────────────────────

export const VerifyCandidateRoute = {
  headers: XHeadersSchema,
  body: t.Object(
    {
      username: t.String({ description: "Twitter handle of the candidate to verify (without @).", examples: ["john_doe"] }),
      tweetId: t.String({ description: "The giveaway tweet ID, used for comment verification if mustComment is enabled.", examples: ["1234567890123456789"] }),
      config: AntiBotFiltersSchema,
    },
    { description: "Candidate verification request with the anti-bot filter configuration." },
  ),
  response: t.Object(
    {
      avatarUrl: t.Nullable(t.String({ description: "Candidate's profile picture URL. Null if not available." })),
      passedPfp: t.Boolean({ description: "True if the candidate has a custom profile picture." }),
      passedBio: t.Boolean({ description: "True if the candidate has a non-empty bio." }),
      passedAge: t.Boolean({ description: "True if the candidate's account age meets the minimum threshold." }),
      actualAgeMonths: t.Optional(t.Number({ description: "Actual account age in months. Only present when mustAge is enabled.", examples: [14] })),
      passedActivity: t.Boolean({ description: "True if the candidate's post count meets the minimum threshold." }),
      actualPosts: t.Optional(t.Number({ description: "Actual post count. Only present when mustActivity is enabled.", examples: [523] })),
      passedComment: t.Boolean({ description: "True if the candidate commented on the giveaway tweet." }),
    },
    { description: "Detailed verification results across all enabled anti-bot checks." },
  ),
  detail: {
    tags: ["X (Twitter) - Verification"],
    summary: "Verify a Candidate",
    description:
      "Verifies whether a specific Twitter user passes all enabled anti-bot filters.\n\n" +
      "Checks: **Profile Picture**, **Bio**, **Account Age**, **Activity**, and **Comment** presence.\n\n" +
      "**Authentication:** Same as the init endpoint — provide `x-auth-token` and `x-ct0` headers.",
  },
};

// ── POST /api/x/draw/save ───────────────────────────────

export const SaveDrawRoute = {
  body: t.Object(
    {
      drawId: t.String({ description: "UUID of the draw session (from POST /api/x/draw/init).", examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
      tweetId: t.String({ description: "The target tweet ID.", examples: ["1234567890123456789"] }),
      hostUsername: t.String({ description: "Twitter handle of the giveaway organizer.", examples: ["fairgiveaway"] }),
      hostAvatarUrl: t.Optional(t.Nullable(t.String({ description: "Host's avatar URL, or null." }))),
      mode: t.Union([t.Literal("likes"), t.Literal("reposts")], { description: "The scraping mode used." }),
      totalParticipants: t.Number({ description: "Total participants in the draw.", examples: [250] }),
      participants: t.Optional(t.Array(t.String(), { description: "Full list of participant usernames." })),
      enabledFeatures: t.Optional(t.Array(t.String(), { description: "Legacy feature flags array." })),
      engagementTasks: t.Optional(EngagementTasksSchema),
      antiBotFilters: t.Optional(AntiBotFiltersSchema),
      winners: t.Array(WinnerSchema, { description: "The final list of drawn winners." }),
    },
    { description: "Complete giveaway payload to persist permanently." },
  ),
  response: t.Object(
    { success: t.Boolean({ description: "True if the draw was saved successfully." }) },
    { description: "Confirmation that the draw has been permanently saved." },
  ),
  detail: {
    tags: ["X (Twitter) - Core"],
    summary: "Save Finalized Draw",
    description:
      "Persists a finalized draw from Redis into MongoDB.\n\n" +
      "The Redis session is automatically deleted after saving.\n\n" +
      "**Important:** The saved giveaway becomes publicly visible in history and leaderboard endpoints.",
  },
};

// ── GET /api/x/draw/status/:id ──────────────────────────

export const DrawStatusRoute = {
  params: t.Object({
    id: t.String({ description: "The draw session UUID (drawId).", examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
  }),
  response: {
    200: t.Object(
      {
        status: t.String({ description: "'active' (in Redis) or 'finalized' (in MongoDB).", examples: ["active"] }),
        data: t.Optional(GiveawaySchema),
        participants: t.Optional(t.Array(t.String(), { description: "Participant list (only when status is 'active')." })),
        mode: t.Optional(t.String({ description: "Scraping mode (only when status is 'active')." })),
        tweetId: t.Optional(t.String({ description: "Tweet ID (only when status is 'active')." })),
        hostUsername: t.Optional(t.String({ description: "Host username (only when status is 'active')." })),
        hostAvatarUrl: t.Optional(t.Nullable(t.String({ description: "Host avatar URL (only when status is 'active')." }))),
        drawId: t.Optional(t.String({ description: "Draw ID echo (only when status is 'active')." })),
      },
      { description: "Draw session found. Shape depends on status: 'finalized' returns `data`, 'active' returns top-level fields." },
    ),
    404: t.Object(
      { error: t.String({ description: "Error message.", examples: ["Draw not found or expired"] }) },
      { description: "No draw found. Active sessions expire after 15 minutes." },
    ),
  },
  detail: {
    tags: ["X (Twitter) - Core"],
    summary: "Get Draw Status",
    description:
      "Retrieves the current status of a draw session by UUID.\n\n" +
      "Checks MongoDB first (finalized), then Redis (active).\n\n" +
      "**TTL:** Active sessions expire after 15 minutes of inactivity.",
  },
};

// ── GET /api/x/giveaways/history ─────────────────────────

export const HistoryRoute = {
  response: t.Array(GiveawaySchema, {
    description: "The 20 most recent finalized giveaways, sorted newest first.",
  }),
  detail: {
    tags: ["X (Twitter) - Discovery"],
    summary: "List Recent Giveaways",
    description:
      "Returns the 20 most recently finalized X (Twitter) giveaways.\n\n" +
      "Each record includes full details: participants, winners, engagement tasks, and anti-bot filters.\n\n" +
      "**Pagination:** Fixed limit of 20. No offset/cursor pagination yet.",
  },
};

// ── GET /api/x/giveaways/tweet/:tweetId ──────────────────

export const TweetHistoryRoute = {
  params: t.Object({
    tweetId: t.String({ description: "The numeric tweet ID to look up.", examples: ["1234567890123456789"] }),
  }),
  response: t.Array(GiveawaySchema, {
    description: "All finalized giveaways for this tweet, sorted newest first.",
  }),
  detail: {
    tags: ["X (Twitter) - Discovery"],
    summary: "Get Giveaways by Tweet",
    description:
      "Retrieves all finalized giveaways for a specific tweet.\n\n" +
      "A single tweet can have multiple records if the organizer ran re-draws. Returns up to 20 records.",
  },
};

// ── GET /api/x/giveaways/leaderboard ─────────────────────

export const LeaderboardRoute = {
  response: t.Array(
    t.Object(
      {
        _id: t.String({ description: "Host's Twitter username (grouping key).", examples: ["fairgiveaway"] }),
        avatarUrl: t.Optional(t.Nullable(t.String({ description: "Host's avatar URL from their most recent giveaway. Null if never resolved." }))),
        totalGiveaways: t.Number({ description: "Total finalized giveaways hosted.", examples: [15] }),
        totalParticipants: t.Number({ description: "Sum of all participants across all giveaways.", examples: [3200] }),
      },
      { description: "Aggregated statistics for a single giveaway host." },
    ),
    { description: "Top 20 hosts ranked by total finalized giveaways (descending)." },
  ),
  detail: {
    tags: ["X (Twitter) - Discovery"],
    summary: "Get Host Leaderboard",
    description:
      "Returns the top 20 giveaway hosts ranked by total finalized giveaways.\n\n" +
      "Each entry includes username, avatar URL, giveaway count, and cumulative participant count.\n\n" +
      "**Aggregation:** Computed via MongoDB aggregation pipeline on every request (not cached).",
  },
};
