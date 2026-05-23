# Contributing to FairGiveaway Backend

Thank you for considering contributing to the FairGiveaway Backend! This API server handles the heavy lifting of participant scraping, bot verification, and permanent storage.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style & Guidelines](#code-style--guidelines)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code of Conduct](#code-of-conduct)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/fairgiveaway-backend.git
   cd fairgiveaway-backend
   ```
3. **Install Bun:** If you don't have Bun installed, run `curl -fsSL https://bun.sh/install | bash`
4. **Install dependencies:**
   ```bash
   bun install
   ```
5. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Fill out the `.env` file with your MongoDB, Upstash Redis, and Twitter cookies for full functionality.
6. **Start the dev server:**
   ```bash
   bun dev
   ```
   The API will be running at [http://localhost:7860](http://localhost:7860) and docs at `/docs`.

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   # or: git checkout -b fix/issue-description
   ```
2. **Make your changes** — Keep functions small (under 50 lines).
3. **Run Typecheck & Linter:** We strictly enforce zero warnings.
   ```bash
   bun run build
   # This runs: bun run lint && bun run typecheck
   ```
4. **Push** to your fork and open a Pull Request against `main`.

---

## Code Style & Guidelines

### Frameworks & Tools
- **Runtime:** We exclusively use **Bun**. Do not introduce Node.js specific APIs if a faster Bun-native alternative exists.
- **Framework:** **ElysiaJS**. Leverage Elysia's plugin system and hooks for middleware.
- **Validation:** **TypeBox** (`t` from `elysia`). All endpoints must have strictly typed request/response schemas.

### TypeScript Rules
- **Strict mode** is enabled.
- **Never use `any`**. Use `unknown` if truly dynamic, or explicitly define the schema.
- We have an AI guardrail in place enforcing **max 50 lines per function**. Extract complex logic into smaller, testable helper functions.

### Architecture Rules
- **Routes:** Keep route handlers (`routes.ts`) thin. Extract business logic to `handlers.ts` or `helpers.ts`.
- **Database:** Mongoose models live in `src/db.ts`. Do not mutate the database outside of verified endpoints.
- **Scraper:** Puppeteer logic lives in `src/scraper/`. Never expose raw cookies in error logs.

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/). Every commit message should be structured as:

```
<type>(<scope>): <description>
```

### Types

| Type | Description |
| :--- | :--- |
| `feat` | A new API endpoint or feature |
| `fix` | A bug fix in existing logic |
| `docs` | Swagger / OpenAPI or Markdown documentation |
| `style` | Formatting, missing semi colons, etc. |
| `refactor` | Code refactoring (no feature or fix) |
| `perf` | Puppeteer / Database performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, or Docker changes |

---

## Pull Request Process

1. **Ensure CI passes:** `bun run build` must succeed locally.
2. **Document new endpoints:** If adding a route, ensure you provide the TypeBox `detail` object so it shows up correctly in the Scalar `/docs`.
3. **Describe changes:** Explain *why* the change is necessary in the PR body.

---

## Reporting Issues

- **Bug reports**: Use the [Issues tab](https://github.com/fair-giveaway/fairgiveaway-backend/issues). Include terminal output, Bun version, and steps to reproduce.
- **Feature requests**: Open a [Discussion](https://github.com/orgs/fair-giveaway/discussions).
- **Security vulnerabilities**: See [SECURITY.md](SECURITY.md) — do NOT open a public issue.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold a welcoming and inclusive environment for everyone.
