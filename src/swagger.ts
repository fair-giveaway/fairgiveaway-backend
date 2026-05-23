import type { ElysiaSwaggerConfig } from "@elysiajs/swagger";

export const swaggerConfig: ElysiaSwaggerConfig<"/docs"> = {
  provider: "scalar",
  path: "/docs",
  documentation: {
    info: {
      title: "FairGiveaway API",
      version: "1.0.0",
      description:
        "RESTful API for the FairGiveaway platform — a transparent and verifiable giveaway tool for X (Twitter).\n\n" +
        "## How It Works\n" +
        "1. **Initialize** a draw by scraping participants (likers/retweeters) from a tweet.\n" +
        "2. **Verify** each drawn candidate against configurable anti-bot filters.\n" +
        "3. **Save** the finalized draw permanently for public auditability.\n\n" +
        "## Authentication\n" +
        "Scraper endpoints (`/api/x/draw/init` and `/api/x/verify`) require Twitter session cookies.\n" +
        "Pass them via request headers `x-auth-token` and `x-ct0`. If omitted, the server falls back to its environment variables.\n\n" +
        "## Data Storage\n" +
        "- **Active sessions**: Stored in Redis (Upstash) with a 15-minute TTL.\n" +
        "- **Finalized giveaways**: Stored permanently in MongoDB.\n\n" +
        "## Bug Reports & Feature Requests\n" +
        "[GitHub Discussions](https://github.com/orgs/fair-giveaway/discussions)",
      contact: {
        name: "FairGiveaway Team",
        url: "https://fairgiveaway.online",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    tags: [
      {
        name: "X (Twitter) - Scraper",
        description: "Endpoints that interact with the Twitter scraper to fetch participant data from tweets. These endpoints require valid Twitter session cookies.",
      },
      {
        name: "X (Twitter) - Verification",
        description: "Endpoints for verifying individual candidates against anti-bot filters (profile picture, bio, account age, activity, comment presence).",
      },
      {
        name: "X (Twitter) - Core",
        description: "Core draw lifecycle endpoints: checking draw status and saving finalized results to permanent storage.",
      },
      {
        name: "X (Twitter) - Discovery",
        description: "Public read-only endpoints for browsing giveaway history and host leaderboards. No authentication required.",
      },
      {
        name: "Draw",
        description: "Cross-platform draw search. Look up any draw session (active or finalized) by its UUID.",
      },
      {
        name: "System",
        description: "Health checks and system status endpoints.",
      },
    ],
    externalDocs: {
      description: "FairGiveaway GitHub Organization",
      url: "https://github.com/orgs/fair-giveaway",
    },
    servers: [
      {
        url: "https://api.fairgiveaway.online",
        description: "Production",
      },
      {
        url: "http://localhost:7860",
        description: "Local Development",
      },
    ],
  },
};
