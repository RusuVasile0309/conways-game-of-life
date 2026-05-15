---
type: implementation-note
date: 2026-05-15
---

# Vercel Deployment

## What this does

Adds `vercel.json` at the repo root so Vercel can build and serve the Next.js web app directly from the Nx monorepo without manual dashboard configuration. A subsequent fix wired up PostgreSQL (via Neon) and Next.js Route Handlers for the save/load pattern feature so the NestJS API does not need a separate deployment.

## Why Vercel

The assignment lists a deployed URL as optional ("welcome but not required"). Vercel is the natural fit for a Next.js app: zero-config deployments, automatic preview URLs per PR, and native Next.js runtime support. No ops surface.

## Configuration decisions

```json
{
  "buildCommand": "api/node_modules/.bin/prisma generate --schema=api/prisma/schema.prisma && api/node_modules/.bin/prisma migrate deploy --schema=api/prisma/schema.prisma && pnpm nx build web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

| Field | Value | Reason |
|---|---|---|
| `buildCommand` | `prisma generate && prisma migrate deploy && nx build web` | Generates the Prisma client and applies any pending migrations before building; uses the project-local v6 binary so Vercel doesn't pull the incompatible v7 via `npx` |
| `outputDirectory` | `apps/web/.next` | `@nx/next/plugin` outputs the `.next` artifact inside the app directory, not the workspace root |
| `framework` | `nextjs` | Tells Vercel to use its native Next.js runtime (correct routing, ISR, middleware support) |
| `installCommand` | `pnpm install --frozen-lockfile` | Consistent with CI; installs from `pnpm-lock.yaml`, no version drift |

## Deviation from architecture doc

The architecture doc lists "Vercel deploy" under "Deliberate Non-Choices": *"Optional per PRD. Local-runnable is the requirement."* This PR adds it anyway as a submission convenience — the interviewer can click a live URL rather than cloning and running locally. It does not change any architectural decisions; it is pure infra config.

## What's not deployed

The NestJS API (`api/`) is not deployed to Vercel. Instead, the Next.js app exposes its own Route Handlers at `/api/patterns` (GET list, POST create) and `/api/patterns/[id]` (GET by id) that talk to PostgreSQL via Prisma directly. The NestJS API is still used for local development when you want to run the full server stack.

## How to connect your fork to Vercel

1. Push this branch and merge to `main`.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import your GitHub fork.
4. Vercel auto-reads `vercel.json` — no manual field overrides needed.
5. Add the `DATABASE_URL` environment variable (see below).
6. Click **Deploy**.

Preview deployments fire automatically on every subsequent PR.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes (for save/load) | PostgreSQL connection string. Provision a free DB at [neon.tech](https://neon.tech) and paste the connection URL. The migration runs automatically during `buildCommand`. |
| `NEXT_PUBLIC_API_BASE_URL` | No | Override the API base the frontend calls. Defaults to `/api` (Next.js route handlers). Set to `https://<your-nestjs-host>` only if running the NestJS API separately. |

### Provisioning a Neon database

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the **pooled connection string** (includes `?sslmode=require`).
3. Add it as `DATABASE_URL` in Vercel → Project Settings → Environment Variables.
4. The first deploy applies the migration automatically via `prisma migrate deploy`.
