---
story: "1.2"
title: "Configure Nx tags and prove module boundaries fire"
status: done
created: 2026-05-13
---

# Story 1.2: Configure Nx tags and prove module boundaries fire

## From epics.md

As the candidate,
I want the Nx tag taxonomy plus `@nx/enforce-module-boundaries` configured and demonstrably failing on a deliberate violation,
So that NFR8 is a real, evaluated deliverable rather than a hand-wave.

**Priority:** MVP
**FR/NFR coverage:** NFR8
**Estimated effort:** M

**Acceptance Criteria:**

**Given** the Nx workspace exists with `apps/web`, `apps/web-e2e`, `libs/sim`, `libs/types`, `libs/ui`, `libs/api-client`,
**When** I configure each project's `tags` in `project.json` per the architecture §5.6 taxonomy,
**Then** root ESLint config has `@nx/enforce-module-boundaries` with the depConstraints and `pnpm nx lint` passes.

**Given** the boundary rules are configured,
**When** I add a deliberately violating import in `libs/sim/src/index.ts`,
**Then** `pnpm nx lint sim` fails with an `@nx/enforce-module-boundaries` error.
**And** the failure output is captured under `docs/implementation-artifacts/`.

**Given** the demonstration is captured,
**When** I revert the violation,
**Then** `pnpm nx lint sim` passes and the violating import is not present in any merged commit.

## Implementation Notes

Scaffolded all four shared libs (`libs/sim`, `libs/types`, `libs/ui`, `libs/api-client`) using `@nx/js:lib` generators and applied the full tag taxonomy from architecture §5.6. The `@nx/enforce-module-boundaries` depConstraints were added verbatim to the root ESLint config.

The deliberate violation used `import { listPatterns } from '@conways-game-of-life/api-client'` in `libs/sim/src/index.ts` (a `scope:sim` → `scope:api-client` crossing). Output was captured in `docs/implementation-artifacts/nfr8-boundary-violation-demo.md`. The violation was reverted immediately.

Two toolchain bugs surfaced during this story and are documented in `docs/implementation-artifacts/ai-usage.md`:
1. AI omitted `"baseUrl": "."` from the TypeScript path aliases config in `tsconfig.base.json`, crashing every Nx target before it could do any real work. Fixed with a single-line addition (`db96fdb`).
2. AI then misread a peer-dependency warning (Playwright version mismatch) as the root cause of the `baseUrl` crash and triggered an unnecessary dependency upgrade cascade. Rolling back with `git checkout HEAD -- package.json pnpm-lock.yaml` recovered the workspace.

## Deviations from Architecture

None. The full tag taxonomy and depConstraints from architecture §5.6 were applied exactly as specified.

## AI Usage

AI generated the initial lib scaffolding and tag config correctly. The two documented failures above (missing `baseUrl`, misdiagnosed cascade) were the most costly AI mistakes across the entire build and are detailed in `ai-usage.md §3`.
