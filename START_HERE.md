# START HERE — Reviewer quick-start

## Deployed app

**`<vercel-url>` — fill in after first deploy**

> Note: the live URL hosts the Next.js frontend only. The NestJS save/load API (Epic 7 stretch tier) requires a separate server process and is not included in the Vercel deployment. All MVP features (grid, simulation, controls, pattern library, rule sets) work without it.
>
> See [docs/implementation-artifacts/vercel-deploy.md](docs/implementation-artifacts/vercel-deploy.md) for deployment details.

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

## Run the app

```bash
pnpm nx serve web
# → http://localhost:4200
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
