# AI Usage Report

<!--
Fill this in honestly. Reviewers read this carefully — it is the highest-signal artifact for evaluating how you direct AI. Be specific. Generic answers ("I used Cursor for everything") tell us nothing.
-->

## Tools and agents used

Claude Code with BMAD workflow commands (epic 4 onward). Workflows run: `/bmad-bmm-create-story`, `/bmad-bmm-dev-story`, `/bmad-bmm-code-review`. The planning artifacts (PRD, architecture, epics) were generated earlier via BMAD planning agents in a separate session.

## Three prompts that worked well

### 1.

See README.md — AI usage section for the narrative version. The most effective prompts were the structured BMAD story files themselves: explicit ACs gave the AI a testable contract rather than a vague description, and adherence improved noticeably.

### 2.

Directing AI to diagnose from the raw error output (not from warning messages) after the dependency cascade in story 1.2. Framing: "Ignore the Playwright version warning. Read the actual crash. What is the real failing line?" The AI correctly identified the missing `baseUrl` on the second attempt.

### 3.

The touch-parity test strategy in story 4.3: I asked AI to prove touch handler parity without direct cell-state inspection from Playwright. AI proposed tapping the canvas → clicking Play → asserting gen-count advances from 0, using the auto-pause useEffect as behavioral proof. Clean indirect assertion.

## Three times AI was wrong, and what you did

### 1. Missing `baseUrl` when adding TypeScript path aliases

When configuring story 1-2, AI added the `@conways-game-of-life/*` path aliases to `tsconfig.base.json` but omitted `"baseUrl": "."`. The `tsconfig-paths` library (used internally by both `@nx/jest/plugin` and `@nx/playwright/plugin` during project graph inference) explicitly requires `baseUrl` to be set when `paths` is present — this is documented in the library. The omission caused every Nx target to crash before doing any real work. The fix was a single line. AI generated the config without applying a constraint it should have known.

### 2. Misdiagnosed root cause, triggering a dependency upgrade cascade

After the `baseUrl` bug broke CI, AI saw a real peer dependency warning (`@playwright/test@1.36.0` vs `@nx/playwright@22.7.1` wanting `^1.51.1`) and assumed that was the cause. It upgraded `@playwright/test` to `1.60.0`, which pulled in conflicting Jest sub-packages. AI then tried to fix those conflicts by upgrading Jest and adding pnpm overrides, making the situation progressively worse. The crash had nothing to do with Playwright versions — the `baseUrl` omission was the actual cause. I stopped AI mid-cascade, asked it to summarise what it kept trying, then directed it to diagnose from the raw error rather than from the warning. Rolling back with `git checkout HEAD -- package.json pnpm-lock.yaml` and a clean reinstall recovered the workspace.

### 3. Unscoped CSS media query overriding desktop canvas height

In story 4.3 (responsive verification), AI added `@media (max-height: 667px)` to shrink the canvas on iPhone SE-sized screens. The rule was correct for mobile but had no width constraint, meaning it would also fire on a desktop viewport with DevTools open (e.g. 1280×640), overriding the `height: 70vh` desktop rule. Code review caught the cascade issue and the fix was adding `and (max-width: 1023px)` to scope it to mobile only. AI applied the rule mechanically without reasoning about the full media query cascade.

## Where AI was most valuable

Epic 2 (pure simulation core). Deterministic, framework-free domain with no React entanglement → predictable AI output. The four Conway rule implementations were accurate, the test scaffolding was solid, and the injectable RNG pattern for `randomize()` was suggested correctly on the first attempt. When the domain is pure and well-specified, AI adds speed with minimal correction overhead.

## Where AI was least valuable, or actively harmful

Epic 3 canvas and state wiring. The interaction between React state, `useRef` for the canvas context, and the rAF accumulator loop required multiple correction cycles. AI's default instinct was to over-load `useEffect` and under-use stable refs, and it entered long reasoning loops when runtime errors appeared rather than isolating the actual failing line. The 20% of bugs that slipped through all required frontend-specific judgment to catch.

## If you started over, what would you do differently with AI?

Start BMAD story files from epic 1. The quality gap between "AI working from an epic description" and "AI working from a story file with explicit ACs" was large and visible — structured ACs gave the AI a testable contract and adherence improved noticeably. Earlier story files would have meant fewer correction cycles across epics 1–3 and a cleaner implementation trail throughout.
