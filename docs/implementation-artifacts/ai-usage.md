# AI Usage Report

<!--
Fill this in honestly. Reviewers read this carefully — it is the highest-signal artifact for evaluating how you direct AI. Be specific. Generic answers ("I used Cursor for everything") tell us nothing.
-->

## Tools and agents used

<!--
Which AI tools did you use during the build? Claude Code, Cursor, opencode, BMAD agents, GitHub Copilot, others?
Which BMAD workflows did you actually run? List them by command, e.g. /bmad-bmm-create-story, /bmad-bmm-dev-story, /bmad-bmm-retrospective.
-->

## Three prompts that worked well

<!--
For each: what you prompted, what the AI produced, why it landed.
Be specific — show the actual prompt or paraphrase tightly. One paragraph each.
-->

### 1.

### 2.

### 3.

## Three times AI was wrong, and what you did

<!--
The most important section. For each: what AI suggested, why it was wrong (architectural, factual, stylistic, performance), what you did instead.
This shows judgment. Be honest — surface real misses, not soft "AI was a bit verbose" complaints.
-->

### 1. Missing `baseUrl` when adding TypeScript path aliases

When configuring story 1-2, AI added the `@conways-game-of-life/*` path aliases to `tsconfig.base.json` but omitted `"baseUrl": "."`. The `tsconfig-paths` library (used internally by both `@nx/jest/plugin` and `@nx/playwright/plugin` during project graph inference) explicitly requires `baseUrl` to be set when `paths` is present — this is documented in the library. The omission caused every Nx target to crash before doing any real work. The fix was a single line. AI generated the config without applying a constraint it should have known.

### 2. Misdiagnosed root cause, triggering a dependency upgrade cascade

After the `baseUrl` bug broke CI, AI saw a real peer dependency warning (`@playwright/test@1.36.0` vs `@nx/playwright@22.7.1` wanting `^1.51.1`) and assumed that was the cause. It upgraded `@playwright/test` to `1.60.0`, which pulled in conflicting Jest sub-packages. AI then tried to fix those conflicts by upgrading Jest and adding pnpm overrides, making the situation progressively worse. The crash had nothing to do with Playwright versions — the `baseUrl` omission was the actual cause. I stopped AI mid-cascade, asked it to summarise what it kept trying, then directed it to diagnose from the raw error rather than from the warning. Rolling back with `git checkout HEAD -- package.json pnpm-lock.yaml` and a clean reinstall recovered the workspace.

### 3.

## Where AI was most valuable

<!-- Two or three sentences. Where did AI accelerate your work meaningfully on this project? -->

## Where AI was least valuable, or actively harmful

<!-- Two or three sentences. Where did AI slow you down or push you toward a bad design? -->

## If you started over, what would you do differently with AI?

<!--
Two or three sentences. Looking at the trail you left across commits, story files, and `_bmad/` artifacts, what would you change about how you used AI on this project?
-->
