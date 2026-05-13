#!/usr/bin/env node
/**
 * Creates a story file under docs/implementation-artifacts/ for a given story ID,
 * pulling the acceptance criteria directly from docs/planning-artifacts/epics.md.
 * Also marks the story as ready-for-dev in sprint-status.yaml.
 *
 * Usage:  node scripts/create-story-file.mjs <story-id>
 *         pnpm create-story 4.2
 *
 * Example:  pnpm create-story 4.2
 *   → creates docs/implementation-artifacts/story-4-2-keyboard-reachability-and-accessible-name-audit.md
 *   → updates sprint-status.yaml: 4-2-... → ready-for-dev
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EPICS_FILE = resolve(ROOT, 'docs/planning-artifacts/epics.md');
const STATUS_FILE = resolve(
  ROOT,
  'docs/implementation-artifacts/sprint-status.yaml',
);
const OUT_DIR = resolve(ROOT, 'docs/implementation-artifacts');

const storyId = process.argv[2];
if (!storyId) {
  console.error(
    'Usage: node scripts/create-story-file.mjs <story-id>  (e.g. 4.2)',
  );
  process.exit(1);
}

const [epicNum, storyNum] = storyId.split('.');
if (!epicNum || !storyNum) {
  console.error('Story ID must be in the form EPIC.STORY, e.g. 4.2');
  process.exit(1);
}

// ── 1. Extract story section from epics.md ───────────────────────────────────

const epicsContent = readFileSync(EPICS_FILE, 'utf8');

// Match "### Story X.Y: Title" (with optional [STRETCH] prefix)
const storyHeaderRegex = new RegExp(
  `### (?:\\[STRETCH\\] )?Story ${epicNum}\\.${storyNum}: (.+?)\\n([\\s\\S]+?)(?=\\n### |\\n## |$)`,
);
const match = epicsContent.match(storyHeaderRegex);

if (!match) {
  console.error(`Story ${storyId} not found in epics.md`);
  process.exit(1);
}

const storyTitle = match[1].trim();
const storyBody = match[2].trim();

// Derive slug for filename: lowercase, spaces→hyphens, strip special chars
const slug = storyTitle
  .toLowerCase()
  .replace(/[[\]()]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const filename = `story-${epicNum}-${storyNum}-${slug}.md`;
const outPath = resolve(OUT_DIR, filename);

if (existsSync(outPath)) {
  console.log(
    `Story file already exists: docs/implementation-artifacts/${filename}`,
  );
  process.exit(0);
}

// ── 2. Write story file ───────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const content = `---
story: "${epicNum}.${storyNum}"
title: "${storyTitle}"
status: in-progress
created: ${today}
---

# Story ${epicNum}.${storyNum}: ${storyTitle}

## From epics.md

${storyBody}

## Implementation Notes

<!-- Add notes as you implement. What decisions did you make? What surprised you? -->

## Deviations from Architecture

<!-- Did you deviate from docs/planning-artifacts/architecture.md or docs/project-context.md?
     If yes, describe the deviation and why. If no, write "None." -->

None.

## AI Usage

<!-- How did AI help on this story? Where did you push back? One short paragraph. -->
`;

writeFileSync(outPath, content);
console.log(`✓ Created docs/implementation-artifacts/${filename}`);

// ── 3. Update sprint-status.yaml to ready-for-dev ────────────────────────────

const statusContent = readFileSync(STATUS_FILE, 'utf8');
const keyRegex = new RegExp(`(  ${epicNum}-${storyNum}-[^:]+: )backlog`);

if (keyRegex.test(statusContent)) {
  const updated = statusContent.replace(keyRegex, '$1ready-for-dev');
  writeFileSync(STATUS_FILE, updated);
  console.log(
    `✓ sprint-status.yaml: ${epicNum}-${storyNum}-... → ready-for-dev`,
  );
} else {
  console.log(
    `  sprint-status.yaml: story ${storyId} not found or already past backlog — no change`,
  );
}
