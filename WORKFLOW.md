# Development Workflow — Conway's Game of Life

Quick-reference for every story. Read top to bottom once per story.
Anything marked **AUTO** is handled by git hooks. Everything else is on you.

---

## Before you start a new story

```
1. Check sprint-status.yaml — pick the next backlog story
2. Run:  /bmad-bmm-create-story               ← MANUAL (BMAD AI command)
         Tell it the story ID, e.g. "4.3"
         It reads epics.md and writes the story file to docs/implementation-artifacts/

3. Create your branch:
   git checkout -b feat/<epic>-<kebab-title>
   e.g.  git checkout -b feat/4-3-responsive-verification
                                                ← pre-push hook will warn if name is wrong
```

---

## While implementing

```
4. Commit often. Format:  type(storyX.X): one-sentence description
   e.g.  feat(story4.3): add 375px responsive Playwright spec
         fix(story4.3): correct scrollWidth assertion

   Types: feat | fix | chore | refactor | test | docs
                                                ← commit-msg hook enforces this format

5. sprint-status.yaml updates itself on every commit.  ← AUTO (pre-commit hook)

6. Tests land in the SAME PR as the code. No "tests later" commits.

7. Fill in the Implementation Notes section of your story file as you go.
```

---

## Before you push / open a PR

```
8.  Run:  /bmad-bmm-code-review                ← MANUAL (BMAD AI command)
          Fix anything it flags before pushing.

9.  Check: does your story file exist?          ← pre-push hook warns if missing
    docs/implementation-artifacts/story-X-Y-*.md

10. Push and open a PR. Title format:
    Story X.Y: <capability summary> (FRN)
    e.g.  Story 4.3: responsive verification at 375px (NFR1)

11. Fill the PR body using .github/PULL_REQUEST_TEMPLATE.md:
    - Story: link it
    - Summary: one sentence
    - Architecture deviations: write "None." or describe the deviation + why
    - Self-review checklist: tick every box before requesting merge
                                                ← MANUAL — requires your judgment
```

---

## After each epic is fully merged

```
12. Run:  /bmad-bmm-retrospective               ← MANUAL (BMAD AI command)
          It writes a retro file to docs/implementation-artifacts/
          Commit and push it. The evaluators read it.

13. Update sprint-status.yaml epic status to done.  ← AUTO on next commit
```

---

## When you are stuck or unsure what to do next

```
Run:  /bmad-agent-bmad-master
      It reads all planning artifacts and tells you what to do.
      The README says explicitly: use this instead of guessing.
```

---

## End-of-project checklist (before final submission)

```
[ ] All epic 4 stories done and merged (4.1 ✓, 4.2, 4.3, 4.4)
[ ] Retrospectives committed for epics 1, 2, 3, 4  (/bmad-bmm-retrospective)
[ ] Story files exist for ALL completed stories 1.1–4.4
[ ] docs/implementation-artifacts/ai-usage.md fully filled in (7 sections)
[ ] README.md rewritten as thinking document  (story 4.4)
    Required sections:
      - One-command local startup
      - Architecture overview + link to docs/planning-artifacts/architecture.md
      - Module boundaries + reference to nfr8-boundary-violation-demo.md
      - Explicit trade-offs and what was deliberately skipped
      - AI usage: one "AI helped" example + one "I pushed back" example
      - What's next with another 8 hours
      - What I'm not happy with
[ ] START_HERE.md created at repo root (interviewer setup guide)
[ ] sprint-status.yaml reflects reality (pnpm sync-sprint to force refresh)
[ ] All four CI checks green on every merged PR
[ ] Loom walkthrough recorded (≤5 min):
      architecture overview
      one trade-off
      one AI hit + one AI miss
      one BMAD workflow you used and what it bought you
```

---

## Automated hooks reference

Installed by `pnpm setup-hooks`. Run that once after cloning.

| Hook | Fires | Does |
|---|---|---|
| `pre-commit` | Every `git commit` | Syncs sprint-status.yaml from git log; stages the result |
| `commit-msg` | Every `git commit` | Rejects commits that don't follow `type(scope): description` |
| `pre-push` | Every `git push` | Warns if branch name looks wrong; warns if story file is missing |

### Manual pnpm scripts

```bash
pnpm setup-hooks          # install/reinstall all git hooks (run once after clone)
pnpm sync-sprint          # manually sync sprint-status.yaml from git log
```

---

## BMAD commands — full list for this project

### Use every story
| Command | When |
|---|---|
| `/bmad-bmm-create-story` | Before starting — generates story file from epics.md |
| `/bmad-bmm-dev-story` | During — guides implementation against the story file |
| `/bmad-bmm-code-review` | Before PR — adversarial review |
| `/bmad-bmm-sprint-status` | Anytime — current state of all stories |

### Use every epic
| Command | When |
|---|---|
| `/bmad-bmm-retrospective` | After epic is merged — required deliverable |

### Use when stuck
| Command | When |
|---|---|
| `/bmad-agent-bmad-master` | Unsure what to do next |
| `/bmad-bmm-correct-course` | Implementation has gone off-track |

### Persona agents (for focused sessions)
| Command | Persona |
|---|---|
| `/bmad-agent-bmm-dev` | Implementation |
| `/bmad-agent-bmm-sm` | Sprint tracking and story creation |
| `/bmad-agent-bmm-qa` | Test generation and quality |
| `/bmad-agent-bmm-architect` | Architecture decisions and deviations |
