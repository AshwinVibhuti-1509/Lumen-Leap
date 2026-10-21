# GitHub repository update — 10-minute checklist

1. In your LOCAL WORKING `Lumen-Leap` folder, copy `README.md`, `LICENSE`, `ATTRIBUTION.md`, `AI_USAGE.md`, and `.gitignore` from this archive into the repository root. Do **not** replace `src/`, `public/`, `tests/`, `package.json`, or any game code.
2. Open a terminal in the repository root (the folder containing `package.json`).
3. Confirm this is the GitHub repo with `git remote -v` and check changed files with `git status`.
4. Remove files that should not be tracked by Git **without deleting them locally** (only if they are present):

   ```bash
   git rm -r --cached .idea
   git rm --cached src/components/Enemy.js.tmp
   ```

   If either command says the path is not tracked, that is okay: skip it.

5. Confirm tests/build locally:

   ```bash
   npm ci
   npm test
   npm run build
   ```

6. Commit and push documentation + cleanup:

   ```bash
   git add README.md LICENSE ATTRIBUTION.md AI_USAGE.md .gitignore
   git commit -m "docs: prepare Lumen Leap competition repository"
   git push origin main
   ```

7. Refresh the GitHub repository page. It should now show the polished README automatically. Confirm the license and credits appear at the top level.
8. Retain public visibility **at least through October 30, 2026** according to the competition rules the organizers posted in Discord.
9. Check the Netlify deployment separately; documentation-only changes do not need a manual redeploy if the site remains playable.

If you work **only in the GitHub web UI**, select **Add file → Upload files** at the repository root, upload README/LICENSE/ATTRIBUTION/AI_USAGE/.gitignore (you may need to edit `.gitignore` via the GitHub file editor), then commit. `git rm --cached` cleanup can be done from WebStorm later.

**Note:** These documents were prepared based on the public GitHub source and the reported development history. Verify details, especially tool credits, before finalizing.
