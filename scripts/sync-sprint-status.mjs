#!/usr/bin/env node
/**
 * Reads the git log, extracts completed story IDs from commit messages,
 * and updates docs/implementation-artifacts/sprint-status.yaml accordingly.
 *
 * Commit messages must follow the pattern: feat(storyX.X): or fix(storyX.X):
 * e.g. "feat(story3.5): speed slider with rAF accumulator"
 *
 * Run manually:  node scripts/sync-sprint-status.mjs
 * Run via pnpm:  pnpm sync-sprint
 * Also called automatically by the pre-commit git hook.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATUS_FILE = resolve(ROOT, 'docs/implementation-artifacts/sprint-status.yaml');

// ── 1. Collect completed story IDs from git log ──────────────────────────────

const log = execSync('git log --oneline --all', { encoding: 'utf8', cwd: ROOT });
const doneStories = new Set();

for (const line of log.split('\n')) {
  const m = line.match(/story\s*(\d+)[\s._-]\s*(\d+)/i);
  if (m) doneStories.add(`${m[1]}.${m[2]}`);
}

// ── 2. Parse and update the YAML line by line ────────────────────────────────

const lines = readFileSync(STATUS_FILE, 'utf8').split('\n');
const today = new Date().toISOString().slice(0, 10);

// Track which story keys exist in each epic so we can derive epic status
// Structure: { epicNum: { total: N, done: N, started: N } }
const epicStats = {};

// Two-pass: first collect all story statuses, then update epics
const updatedLines = lines.map(line => {
  // Update the generated date
  if (/^generated:/.test(line)) return `generated: ${today}`;

  // Story line pattern: "  1-2-some-story-slug: status"
  const storyMatch = line.match(/^  (\d+)-(\d+)-[^:]+:\s+(\S+)/);
  if (storyMatch) {
    const [, epic, story, currentStatus] = storyMatch;
    const id = `${epic}.${story}`;

    if (!epicStats[epic]) epicStats[epic] = { total: 0, done: 0, started: 0 };
    epicStats[epic].total++;

    // Only advance status, never downgrade
    if (doneStories.has(id) && currentStatus !== 'done') {
      epicStats[epic].done++;
      epicStats[epic].started++;
      return line.replace(/:\s+\S+$/, ': done');
    }

    if (currentStatus === 'done') {
      epicStats[epic].done++;
      epicStats[epic].started++;
    } else if (currentStatus === 'in-progress' || currentStatus === 'review' || currentStatus === 'ready-for-dev') {
      epicStats[epic].started++;
    }
  }

  return line;
});

// Second pass: update epic-level statuses
const finalLines = updatedLines.map(line => {
  const epicMatch = line.match(/^  (epic-(\d+)):\s+(\S+)/);
  if (epicMatch) {
    const [, , num, currentStatus] = epicMatch;
    const stats = epicStats[num];
    if (!stats) return line;

    let newStatus;
    if (stats.done === stats.total) {
      newStatus = 'done';
    } else if (stats.started > 0) {
      newStatus = 'in-progress';
    } else {
      newStatus = 'backlog';
    }

    if (newStatus !== currentStatus) {
      return line.replace(/:\s+\S+$/, `: ${newStatus}`);
    }
  }
  return line;
});

// ── 3. Write back ─────────────────────────────────────────────────────────────

const result = finalLines.join('\n');
writeFileSync(STATUS_FILE, result);

const doneList = [...doneStories].sort().join(', ');
console.log(`✓ sprint-status.yaml synced  (done: ${doneList || 'none detected'})`);
