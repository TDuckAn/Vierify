# /e2e-fix — Auto-fetch CI failures and fix E2E tests

Fetch the latest Playwright CI run failure log and fix all failing E2E tests without user copy-paste.

## Steps

1. **Find the latest failed run:**
   ```powershell
   & "C:\Program Files\GitHub CLI\gh.exe" run list --workflow=ci.yml --limit 5 --json databaseId,status,conclusion,name,headBranch
   ```
   Pick the most recent run where conclusion is "failure" or status is "completed" with failure.

2. **Fetch the failure log:**
   ```powershell
   & "C:\Program Files\GitHub CLI\gh.exe" run view <databaseId> --log-failed 2>&1
   ```
   The output is saved to a persisted file. Read first 700 lines, then more if needed.

3. **Parse failures** — extract each failing test: file path, test name, error message, locator.

4. **For each failing test**, read the relevant spec file + the corresponding page/component source.

5. **Triage by owner:**
   - **Claude fixes (do it now):** wrong URL path, selector strict-mode violation (use `{ exact: true }`), element not found due to wrong route mapping, visibility assertion failing on mobile (`toBeVisible` → `toBeAttached` for elements hidden at small viewports), wrong text label in source
   - **Codex task (write to PIPELINE_TASK.md):** component logic bug (validation threshold, state machine, wrong tRPC call), missing feature that the test expects

6. **Apply all Claude-scope fixes** using Edit/Write tools.

7. **Typecheck:** `pnpm --filter @vierify/web typecheck`

8. **Commit and push:**
   ```powershell
   git add -A
   git commit -m "fix(web): fix E2E test failures from CI run <databaseId>"
   git push
   ```

9. **Report:** list what was fixed, what (if anything) was delegated to Codex.

## Notes
- The `gh` CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` (not in PATH for bash or PowerShell — use full path)
- CI run log is large (~500KB); read in chunks of 300-400 lines
- Each unique root cause may cascade into many test failures — fix the root, not each symptom
- Route group folders `(name)` do NOT add to the URL — if a page at `(group)/foo/page.tsx` should be at `/bar/foo`, create it at `(group)/bar/foo/page.tsx`
