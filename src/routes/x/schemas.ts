import { t } from "elysia";

// ── Authentication Headers ───────────────────────────────
export const XHeadersSchema = t.Optional(
  t.Object({
    "x-auth-token": t.Optional(
      t.String({
        description:
          "Twitter auth_token cookie value. When provided together with x-ct0, these credentials are used instead of the server's environment variables. Obtain from browser DevTools → Application → Cookies → twitter.com → auth_token.",
        examples: ["a1b2c3d4e5f6..."],
      }),
    ),
    "x-ct0": t.Optional(
      t.String({
        description:
          "Twitter ct0 CSRF token cookie value. Must be provided together with x-auth-token. Obtain from browser DevTools → Application → Cookies → twitter.com → ct0.",
        examples: ["f6e5d4c3b2a1..."],
      }),
    ),
  }),
);

// ── Winner ───────────────────────────────────────────────

export const WinnerSchema = t.Object(
  {
    username: t.String({
      description: "Twitter handle of the winner (without @)",
      examples: ["elonmusk"],
    }),
    type: t.String({
      description: "Winner tier. 'primary' = main winner, 'secondary' = backup winner drawn as replacement.",
      examples: ["primary"],
    }),
    status: t.String({
      description: "Verification outcome. 'verified' = passed all anti-bot checks, 'failed' = rejected by at least one filter.",
      examples: ["verified"],
    }),
    avatarUrl: t.Optional(
      t.Nullable(
        t.String({
          description: "URL to the winner's Twitter profile picture. Null if the avatar could not be resolved.",
          examples: ["https://pbs.twimg.com/profile_images/123/photo.jpg"],
        }),
      ),
    ),
    commentProofUrl: t.Optional(
      t.Nullable(
        t.String({
          description: "Direct URL to the winner's comment on the giveaway tweet, if comment verification was enabled.",
          examples: ["https://x.com/user/status/1234567890"],
        }),
      ),
    ),
    failReason: t.Optional(
      t.Nullable(
        t.String({
          description: "Human-readable reason why verification failed. Only present when status is 'failed'.",
          examples: ["Account too new: 0 months old (Requires 1)"],
        }),
      ),
    ),
  },
  { description: "Represents a single winner drawn from the giveaway, including their verification result." },
);

// ── Anti-Bot Filters ─────────────────────────────────────

export const AntiBotFiltersSchema = t.Object(
  {
    mustPfp: t.Optional(
      t.Boolean({ description: "When true, candidates must have a custom profile picture (not the default egg/silhouette)." }),
    ),
    mustBio: t.Optional(
      t.Boolean({ description: "When true, candidates must have a non-empty bio/description on their profile." }),
    ),
    mustAge: t.Optional(
      t.Boolean({ description: "When true, candidates must have an account older than minMonths." }),
    ),
    minMonths: t.Optional(
      t.Number({
        description: "Minimum account age in months. Only used when mustAge is true. Defaults to 1 on the frontend.",
        minimum: 1,
        examples: [1],
      }),
    ),
    mustActivity: t.Optional(
      t.Boolean({ description: "When true, candidates must have posted at least minPosts tweets/replies." }),
    ),
    minPosts: t.Optional(
      t.Number({
        description: "Minimum number of posts (tweets + replies). Only used when mustActivity is enabled.",
        minimum: 1,
        examples: [10],
      }),
    ),
    mustComment: t.Optional(
      t.Boolean({ description: "When true, candidates must have commented (replied) on the giveaway tweet." }),
    ),
  },
  { description: "Anti-bot filter configuration applied during winner verification." },
);

// ── Engagement Tasks ─────────────────────────────────────

export const EngagementTasksSchema = t.Object(
  {
    mustLike: t.Optional(t.Boolean({ description: "Require the candidate to have liked the giveaway tweet." })),
    mustComment: t.Optional(t.Boolean({ description: "Require the candidate to have commented on the giveaway tweet." })),
    mustFollow: t.Optional(t.Boolean({ description: "Require the candidate to follow specific accounts listed in followUsernames." })),
    followUsernames: t.Optional(
      t.Array(t.String({ examples: ["fairgiveaway"] }), {
        description: "List of Twitter usernames (without @) the candidate must follow when mustFollow is true.",
      }),
    ),
    mustExternal: t.Optional(t.Boolean({ description: "When true, candidates must also engage with an external tweet specified by externalUrl." })),
    externalUrl: t.Optional(
      t.Nullable(t.String({
        description: "Full URL to an external tweet that candidates must engage with when mustExternal is true.",
        examples: ["https://x.com/user/status/1234567890"],
      })),
    ),
    extMustLike: t.Optional(t.Boolean({ description: "Require like on the external tweet." })),
    extMustRepost: t.Optional(t.Boolean({ description: "Require repost (retweet) of the external tweet." })),
    extMustComment: t.Optional(t.Boolean({ description: "Require comment (reply) on the external tweet." })),
    extMustQuote: t.Optional(t.Boolean({ description: "Require quote tweet of the external tweet." })),
  },
  { description: "Engagement task requirements the organizer set for participation eligibility." },
);

// ── Giveaway (Full Record) ───────────────────────────────

export const GiveawaySchema = t.Object(
  {
    _id: t.String({ description: "Unique giveaway identifier (UUID v4, originally the drawId).", examples: ["550e8400-e29b-41d4-a716-446655440000"] }),
    tweetId: t.String({ description: "The numeric ID of the target tweet from which participants were scraped.", examples: ["1234567890123456789"] }),
    hostUsername: t.String({ description: "Twitter handle of the giveaway organizer (without @). May be 'unknown' if auto-detection failed.", examples: ["fairgiveaway"] }),
    hostAvatarUrl: t.Optional(t.Nullable(t.String({ description: "URL to the host's Twitter profile picture. Null if could not be resolved." }))),
    platform: t.String({ description: "Social platform where the giveaway took place. Currently always 'X'.", examples: ["X"] }),
    mode: t.String({ description: "Scraping source: 'likes' = drew from tweet likers, 'reposts' = drew from retweeters.", examples: ["likes"] }),
    totalParticipants: t.Number({ description: "Total number of valid participants successfully scraped." }),
    participants: t.Array(t.String(), { description: "Array of participant usernames. Often omitted to save bandwidth unless explicitly requested." }),
    enabledFeatures: t.Array(t.String(), { description: "Legacy field listing enabled feature flags. Preserved for backward compatibility." }),
    engagementTasks: t.Optional(EngagementTasksSchema),
    antiBotFilters: t.Optional(AntiBotFiltersSchema),
    winners: t.Array(WinnerSchema, { description: "Ordered list of drawn winners with their verification results." }),
    createdAt: t.Union([t.String(), t.Date()], { description: "ISO 8601 timestamp of when the giveaway was finalized and saved." }),
  },
  { description: "A fully finalized giveaway record stored permanently in the database." },
);
