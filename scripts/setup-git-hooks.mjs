#!/usr/bin/env node
/**
 * Installs all git hooks into .git/hooks/.
 * Run once after cloning:  pnpm setup-hooks
 *
 * Hooks installed:
 *   pre-commit  — syncs sprint-status.yaml from git log; stages the result
 *   commit-msg  — enforces conventional commits format: type(scope): description
 *   pre-push    — warns if branch name is wrong; warns if story file is missing
 */

import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS_DIR = resolve(ROOT, '.git/hooks');

if (!existsSync(HOOKS_DIR)) {
  mkdirSync(HOOKS_DIR, { recursive: true });
}

function install(name, content) {
  const hookPath = resolve(HOOKS_DIR, name);
  writeFileSync(hookPath, content);
  chmodSync(hookPath, 0o755);
  console.log(`✓ Installed .git/hooks/${name}`);
}

// ── pre-commit ────────────────────────────────────────────────────────────────
// Syncs sprint-status.yaml from git log and stages the update so it lands in
// the same commit automatically. No manual step needed.

install('pre-commit', `#!/bin/bash
# Auto-installed by scripts/setup-git-hooks.mjs
node scripts/sync-sprint-status.mjs
git add docs/implementation-artifacts/sprint-status.yaml
`);

// ── commit-msg ────────────────────────────────────────────────────────────────
// Enforces conventional commits: type(optional-scope): description
// Valid types: feat | fix | chore | refactor | test | docs | style | perf | ci
// Merge commits and fixup commits are allowed through unchanged.

install('commit-msg', `#!/bin/bash
# Auto-installed by scripts/setup-git-hooks.mjs
# Enforces: type(optional-scope): description

MSG_FILE="$1"
MSG=$(cat "$MSG_FILE")

# Allow merge commits, fixup/squash commits, and revert commits through
if echo "$MSG" | grep -qE "^(Merge |fixup! |squash! |Revert )"; then
  exit 0
fi

# Conventional commits pattern
PATTERN="^(feat|fix|chore|refactor|test|docs|style|perf|ci)(\\([^)]+\\))?: .+"

if ! echo "$MSG" | grep -qE "$PATTERN"; then
  echo ""
  echo "✗ Commit message does not follow Conventional Commits format."
  echo ""
  echo "  Required:  type(optional-scope): description"
  echo "  Examples:"
  echo "    feat(story4.3): add 375px responsive Playwright spec"
  echo "    fix(story4.2): revert hardcoded disabled=false on Play button"
  echo "    chore: update sprint-status.yaml"
  echo ""
  echo "  Valid types: feat | fix | chore | refactor | test | docs | style | perf | ci"
  echo ""
  exit 1
fi

exit 0
`);

// ── pre-push ──────────────────────────────────────────────────────────────────
// Warns (does NOT block) if:
//   1. The branch name doesn't follow the expected pattern
//   2. No story file exists in docs/implementation-artifacts/ for this branch
// Uses warnings not hard failures so you can still push hotfixes unimpeded.

install('pre-push', `#!/bin/bash
# Auto-installed by scripts/setup-git-hooks.mjs
# Warns on wrong branch name or missing story file. Does not block the push.

BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
WARN=0

# ── 1. Branch naming check ────────────────────────────────────────────────────
# Expected patterns: feat/X-*, fix/X-*, story/X-Y-*, chore/*, docs/*, main, develop
if ! echo "$BRANCH" | grep -qE "^(feat|fix|story|chore|docs|refactor|test|perf|ci)/.+|^(main|develop|HEAD)$"; then
  echo ""
  echo "⚠ Branch name '$BRANCH' does not follow the expected convention."
  echo "  Expected:  feat/<epic>-<kebab-title>  or  story/<epic>-<story>-<kebab-title>"
  echo "  Examples:"
  echo "    feat/4-3-responsive-verification"
  echo "    feat/4-e2e-accessibility-polish"
  echo ""
  WARN=1
fi

# ── 2. Story file check ───────────────────────────────────────────────────────
# Extract story ID from branch name, e.g. feat/4-3-* → look for story-4-3-*.md
# Also handles feat/4-e2e-* style (epic-only branches) — skips the check.
STORY_FILE_PATTERN=""

if echo "$BRANCH" | grep -qE "^(feat|story)/([0-9]+)-([0-9]+)-"; then
  EPIC=$(echo "$BRANCH" | sed -E 's|^[^/]+/([0-9]+)-([0-9]+)-.*|\\1|')
  STORY=$(echo "$BRANCH" | sed -E 's|^[^/]+/([0-9]+)-([0-9]+)-.*|\\2|')
  STORY_FILE_PATTERN="docs/implementation-artifacts/story-\${EPIC}-\${STORY}-*.md"

  if ! ls \$STORY_FILE_PATTERN 2>/dev/null | grep -q .; then
    echo ""
    echo "⚠ No story file found for story \${EPIC}.\${STORY}."
    echo "  Expected:  \$STORY_FILE_PATTERN"
    echo "  Run:  /bmad-bmm-create-story  and give it story ID \${EPIC}.\${STORY}"
    echo "  See WORKFLOW.md step 2 for the full process."
    echo ""
    WARN=1
  fi
fi

# ── 3. Reminder about code review ────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Pre-push checklist (WORKFLOW.md steps 8–11):"
echo ""
echo "  [ ] /bmad-bmm-code-review run and issues fixed?"
echo "  [ ] Story file exists and Implementation Notes filled in?"
echo "  [ ] PR body ready? (title, deviations, self-review checklist)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0
`);

// ── summary ───────────────────────────────────────────────────────────────────

console.log('');
console.log('Hooks active:');
console.log('  pre-commit  → syncs sprint-status.yaml automatically');
console.log('  commit-msg  → enforces type(scope): description format');
console.log('  pre-push    → warns on wrong branch name or missing story file');
console.log('               + prints pre-push checklist reminder');
console.log('');
console.log('Manual pnpm scripts:');
console.log('  pnpm setup-hooks     re-install all hooks (run once after clone)');
console.log('  pnpm sync-sprint     manually sync sprint-status.yaml from git log');
console.log('');
console.log('See WORKFLOW.md for the full per-story process.');
