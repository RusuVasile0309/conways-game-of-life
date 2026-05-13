# Branch Protection Configuration — `main`

## Required settings

Navigate to **Settings → Branches → Add branch protection rule** and apply the following to the `main` branch pattern:

| Setting | Value |
|---|---|
| Require a pull request before merging | ✅ |
| Required approving reviews | 1 |
| Require status checks to pass before merging | ✅ |
| Required status checks | `lint`, `typecheck`, `test`, `e2e` |
| Require branches to be up to date before merging | ✅ |
| Do not allow bypassing the above settings | ✅ |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

## Auto-approve

`.github/workflows/auto-approve.yml` triggers on `workflow_run` completion of the CI workflow.
When all four jobs (`lint`, `typecheck`, `test`, `e2e`) pass, `hmarr/auto-approve-action@v4`
posts an approving review from `github-actions[bot]`, satisfying the one required review.
A PR with any failing check does not trigger the approval.
