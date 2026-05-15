---
type: implementation-note
date: 2026-05-15
---

# Vercel Deployment

## What this does

Adds `vercel.json` at the repo root so Vercel can build and serve the Next.js web app directly from the Nx monorepo without manual dashboard configuration.

## Why Vercel

The assignment lists a deployed URL as optional ("welcome but not required"). Vercel is the natural fit for a Next.js app: zero-config deployments, automatic preview URLs per PR, and native Next.js runtime support. No ops surface.

## Configuration decisions

```json
{
  "buildCommand": "pnpm nx build web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

| Field | Value | Reason |
|---|---|---|
| `buildCommand` | `pnpm nx build web` | Runs from the repo root so Nx can resolve workspace paths and lib aliases |
| `outputDirectory` | `apps/web/.next` | `@nx/next/plugin` outputs the `.next` artifact inside the app directory, not the workspace root |
| `framework` | `nextjs` | Tells Vercel to use its native Next.js runtime (correct routing, ISR, middleware support) |
| `installCommand` | `pnpm install --frozen-lockfile` | Consistent with CI; installs from `pnpm-lock.yaml`, no version drift |

## Deviation from architecture doc

The architecture doc lists "Vercel deploy" under "Deliberate Non-Choices": *"Optional per PRD. Local-runnable is the requirement."* This PR adds it anyway as a submission convenience — the interviewer can click a live URL rather than cloning and running locally. It does not change any architectural decisions; it is pure infra config.

## What's not deployed

The NestJS API (`apps/api`) is a stretch-tier backend that requires a separate server process. Vercel only hosts the Next.js frontend. The save/load pattern feature requires the API to be running separately (e.g., Railway, Render, or local). This is acceptable: the MVP feature set (grid, simulation, controls, pattern library) is fully client-side and works without the API.

## How to connect your fork to Vercel

1. Push this branch and merge to `main`.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import your GitHub fork.
4. Vercel auto-reads `vercel.json` — no manual field overrides needed.
5. Click **Deploy**.

Preview deployments fire automatically on every subsequent PR.

## Environment variables

None required for the MVP/frontend. If the NestJS API is deployed separately, set:

```
NEXT_PUBLIC_API_BASE_URL=https://<your-api-host>
```
