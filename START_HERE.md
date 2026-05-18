# START HERE — Reviewer quick-start

## Deployed app

**`<vercel-url>` — fill in after first deploy**

> Save/load patterns requires a `DATABASE_URL` env var set in Vercel (see [docs/implementation-artifacts/vercel-deploy.md](docs/implementation-artifacts/vercel-deploy.md)). All other features (grid, simulation, controls, pattern library, rule sets) work without it.

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm i -g pnpm`)

## One-time setup

```bash
git clone <repo-url>
cd conways-game-of-life
pnpm install
pnpm exec playwright install --with-deps
```

## Database setup (save/load feature)

The save/load pattern feature persists data to PostgreSQL via Prisma. A free [Neon](https://neon.tech) database works well.

1. Copy the env template and fill in your connection string:

   ```bash
   cp .env.example apps/web/.env.local
   # edit apps/web/.env.local — set DATABASE_URL to your PostgreSQL connection string
   ```

   > Next.js loads env files from the app directory (`apps/web/`), not the repo root.

2. Apply the migration to create the `Pattern` table:

   ```bash
   api/node_modules/.bin/prisma migrate deploy --schema=api/prisma/schema.prisma
   ```

3. (Optional) regenerate the Prisma client after any schema changes:

   ```bash
   pnpm nx run api:generate
   ```

> Without `DATABASE_URL` the app still runs — save/load shows an error, everything else works normally.

## Run the app

```bash
pnpm nx dev web
# → http://localhost:3000
```

## Run the tests

```bash
pnpm nx test sim          # Jest unit tests — pure Conway rules engine
pnpm nx e2e web-e2e       # Playwright E2E — happy path, a11y, responsive
pnpm nx lint web          # ESLint + module boundary enforcement
pnpm nx typecheck web     # TypeScript type-check
```

## Run all CI checks at once

```bash
pnpm nx run-many -t lint,typecheck,test,e2e
```

See [README.md](README.md) for architecture, trade-offs, and AI usage notes.
