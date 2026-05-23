<p align="center">
  <img src="https://raw.githubusercontent.com/fair-giveaway/fairgiveaway-frontend/refs/heads/master/public/logo.png" alt="FairGiveaway Logo" width="80" height="80" style="border-radius: 16px;" />
</p>

<h1 align="center">FairGiveaway — Backend</h1>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://api.fairgiveaway.online/docs"><img src="https://img.shields.io/badge/API_Docs-Scalar-6D28D9" alt="API Docs" /></a>
  <a href="https://github.com/fair-giveaway/fairgiveaway-backend/issues"><img src="https://img.shields.io/github/issues/fair-giveaway/fairgiveaway-backend" alt="Issues" /></a>
</p>

<p align="center">
  The backend API server for <strong>FairGiveaway</strong> — handling participant scraping, anti-bot verification, session management, and permanent result storage.<br />
  Built with Bun, ElysiaJS, Puppeteer, MongoDB, and Upstash Redis.
</p>

<p align="center">
  <a href="https://api.fairgiveaway.online/docs">API Docs</a> •
  <a href="https://fairgiveaway.online">Live Site</a> •
  <a href="https://github.com/fair-giveaway/fairgiveaway-frontend">Frontend Repo</a> •
  <a href="https://github.com/orgs/fair-giveaway/discussions">Discussions</a>
</p>

---

## Features

- **Participant Scraping** — Puppeteer-based headless scraping of tweet likes and reposts via Twitter's internal GraphQL API.
- **Anti-Bot Verification** — Profile picture check, bio check, minimum account age, minimum post count, and comment verification.
- **Engagement Tasks** — Verify that candidates liked, commented, followed, or engaged with external tweets.
- **Session Management** — Ephemeral draw sessions stored in Upstash Redis with automatic 15-minute TTL expiration.
- **Permanent Records** — Finalized draws are immutably stored in MongoDB Atlas as public audit trails.
- **Global Leaderboards** — Aggregated host statistics with pagination and sorting.
- **Contact Form** — Nodemailer-powered email endpoint with branded HTML templates via Zoho Mail SMTP.
- **Interactive API Docs** — Auto-generated Scalar documentation from TypeBox schemas.

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| [Bun](https://bun.sh/) | JavaScript runtime |
| [ElysiaJS](https://elysiajs.com/) | Web framework with TypeBox validation |
| [Puppeteer](https://pptr.dev/) | Headless Chromium for scraping |
| [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) | Permanent data storage |
| [Upstash Redis](https://upstash.com/) | Serverless ephemeral session cache |
| [Nodemailer](https://nodemailer.com/) | SMTP email delivery |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Docker](https://www.docker.com/) | Containerized deployment |

---

## Getting Started

### Prerequisites

- **Bun** v1.0+ ([install](https://bun.sh/))
- **Docker** (for production deployment)
- **MongoDB Atlas** account (free M0 tier works)
- **Upstash Redis** account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/fair-giveaway/fairgiveaway-backend.git
cd fairgiveaway-backend

# Install dependencies
bun install

# Copy environment template
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Start the development server
bun dev
```

The API server starts at [http://localhost:7860](http://localhost:7860).

API documentation is available at [http://localhost:7860/docs](http://localhost:7860/docs).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |
| `X_AUTH_TOKEN` | Twitter session cookie (`auth_token`) |
| `X_CT0` | Twitter session cookie (`ct0`) |
| `SMTP_HOST` | SMTP server hostname (default: `smtp.zoho.com`) |
| `SMTP_PORT` | SMTP port (default: `465`) |
| `SMTP_SECURE` | Use TLS (default: `true`) |
| `EMAIL_USER` | SMTP sender email address |
| `EMAIL_PASS` | SMTP app-specific password |

---

## Project Structure

```
fairgiveaway-backend/
├── src/
│   ├── index.ts             # App entry point & route registration
│   ├── db.ts                # MongoDB & Redis connection setup
│   ├── swagger.ts           # Scalar API docs configuration
│   ├── routes/
│   │   ├── contact.ts       # POST /api/contact (email form)
│   │   ├── draw.ts          # Draw lifecycle routes
│   │   └── x/               # X (Twitter) platform routes
│   │       ├── index.ts     # Route exports
│   │       ├── routes.ts    # Endpoint definitions
│   │       ├── handlers.ts  # Request handlers
│   │       ├── helpers.ts   # Shared utilities
│   │       └── schemas.ts   # TypeBox validation schemas
│   ├── scraper/             # Puppeteer scraping logic
│   ├── scripts/             # Utility scripts (e.g., clear-db)
│   └── templates/           # Email HTML templates
├── Dockerfile               # Production container
├── .env.example             # Environment variable template
├── package.json
└── tsconfig.json
```

---

## API Endpoints

| Method | Endpoint | Tag | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | System | API info |
| `GET` | `/api/health-check-xyz-9912` | System | Health check |
| `POST` | `/api/contact` | System | Send contact email |
| `POST` | `/api/x/scrape/likers` | Scraper | Scrape tweet likers |
| `POST` | `/api/x/scrape/retweeters` | Scraper | Scrape tweet retweeters |
| `POST` | `/api/x/verify-candidate` | Verification | Verify a single candidate |
| `GET` | `/api/x/draw-status/:drawId` | Core | Check draw session status |
| `POST` | `/api/x/save-draw` | Core | Finalize and save draw |
| `GET` | `/api/x/history` | Discovery | Browse draw history |
| `GET` | `/api/x/history/:id` | Discovery | Get draw by ID |
| `GET` | `/api/x/leaderboard` | Discovery | Host leaderboard |

Full interactive documentation: [api.fairgiveaway.online/docs](https://api.fairgiveaway.online/docs)

---

## Docker Deployment

```bash
# Build and run with Docker Compose
docker compose up -d --build

# View logs
docker compose logs -f backend

# Rebuild after code changes
docker compose up -d --build backend
```

---

## Scripts

| Command | Description |
| :--- | :--- |
| `bun dev` | Start dev server with hot reload |
| `bun start` | Start production server |
| `bun run build` | Lint + typecheck |
| `bun run lint` | Run ESLint with zero warnings |
| `bun run typecheck` | TypeScript type checking |
| `bun run clear-db` | Clear all database collections |

---

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

## Security

To report a security vulnerability, please see our [Security Policy](SECURITY.md).

## Support the Project

### THANK YOU FOR USING FAIRGIVEAWAY!

If you found this tool helpful for running your giveaway, consider leaving a tip. Your support keeps the platform provably fair and free for everyone!

**EVM Address**
```text
0x6e9b40a8fe85e7dcff40cfc9aa526106fe8e0546
```

**Solana Address**
```text
AnBiWNPW68djMF6ERBpueF8tWmcvHr6iCYzriXwGh9k6
```

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Trust Built into the Code.</strong><br/>
  <a href="https://fairgiveaway.online">fairgiveaway.online</a> •
  <a href="https://x.com/FairGiveaway">@FairGiveaway</a>
</p>