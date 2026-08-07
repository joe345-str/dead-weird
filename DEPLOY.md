# Deployment instructions for deadweird

This document explains how to deploy this site to Netlify and Cloudflare Workers, how the GitHub Actions workflows work, and common troubleshooting steps.

## Netlify (recommended for this repo)

1) Create a Netlify access token
   - In Netlify: User Menu → Applications → New access token. Copy the token.

2) Find your Site ID
   - In Netlify: Site → Site settings → Site information → Site ID.

3) Add repository secrets in GitHub
   - Go to: Settings → Secrets and variables → Actions → New repository secret.
   - Add two secrets:
     - `NETLIFY_AUTH_TOKEN` — value = Netlify access token
     - `NETLIFY_SITE_ID` — value = Netlify Site ID

4) How the workflow runs
   - Workflow file: `.github/workflows/netlify-deploy.yml` (runs on push to `main`).
   - It installs `netlify-cli`, optionally runs a `npm run build` if your project has a build script, then runs:
     - `netlify deploy --dir=./ --prod --site=$NETLIFY_SITE_ID`
   - By default the workflow publishes the repo root. If your site build output is in another folder (for example `build/`, `dist/`, or `public/`) update the `--dir` argument in the workflow or add a build step that outputs into the publish folder.

5) Trigger a run
   - Push to `main` or create an empty commit:
     - `git commit --allow-empty -m "trigger deploy" && git push`
   - Monitor Actions → `Deploy to Netlify` for logs.

6) Troubleshooting
   - 401/403 authentication errors: token missing, expired, or with wrong scopes. Recreate token with correct permissions and update `NETLIFY_AUTH_TOKEN` secret.
   - Missing files / "No files to deploy": `--dir` is wrong or build step did not create files. Update `--dir` or fix the build.
   - Build failures: run `npm ci` and `npm run build` locally with Node 18 to reproduce and fix.
   - Secrets are not available on fork/PR workflows: the workflow runs on `main` push will have secrets; PRs from forks will not.

---

## Cloudflare Workers (Wrangler)

If you are using Cloudflare Workers, prefer Wrangler v2 (JS) unless your project explicitly uses the Rust-based v1.

1) Create a Cloudflare API token
   - Cloudflare Dashboard → My Profile → API Tokens → Create Token.
   - Give the token permissions for Workers and Account read access (or use recommended template). Note your `CF_ACCOUNT_ID` from Account → Overview.

2) Add GitHub secrets
   - `CF_API_TOKEN` (value = API token)
   - `CF_ACCOUNT_ID` (value = account id)

3) Example workflow step (wrangler v2 / JS)
   - uses: actions/checkout@v4
   - uses: actions/setup-node@v4
     with:
       node-version: '18'
   - run: npm ci && npm run build
   - run: npx wrangler publish --account-id ${{ secrets.CF_ACCOUNT_ID }}
     env:
       CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}

4) Common Wrangler issues
   - `wrangler` not found: install via `npm i -g wrangler` or use `npx wrangler` in the workflow.
   - v1 vs v2 incompatibility: ensure your project expects the Wrangler version used by the workflow.
   - Authentication failures: token must have correct permissions.

---

## GitHub Pages note

There is an existing Pages workflow at `.github/workflows/static.yml` that deploys to GitHub Pages. If you plan to use Netlify, you can leave the Pages workflow in place, disable GitHub Pages in Settings, or remove the Pages workflow file.

---

## Local testing & quick commands

- Build locally (Node example):
  - `npm ci`
  - `npm run build`
- Serve static files locally:
  - `python -m http.server 8000` (run from the publish directory)
- Trigger workflow manually (if you add `workflow_dispatch`): use Actions UI or the GitHub CLI.

---

## If you want me to make more changes

Tell me one of the following and I will commit the change:
- Change the Netlify `--dir` publish path to a specific folder (tell me the folder name).
- Add `workflow_dispatch` to the Netlify workflow so you can trigger it manually.
- Add a Cloudflare Wrangler workflow (tell me whether you use Wrangler v2 (JS) or v1 (Rust)).
- Remove or disable the GitHub Pages workflow.

---

End of instructions.
