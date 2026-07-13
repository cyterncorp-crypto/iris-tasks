# Codex Notes - Iris Tasks

## Vercel accounts

This project has two Vercel account contexts on Andre's machine. Do not rely on the default global Vercel login when deploying this repo.

Use explicit Vercel CLI profiles with `--global-config`:

```bash
vercel --global-config "$HOME/.vercel-accounts/privify" whoami
vercel --global-config "$HOME/.vercel-accounts/imandrelucas" whoami
```

Known accounts:

- `andre@privify.com.br`
  - CLI username seen locally: `andre-8135`
  - Local profile: `$HOME/.vercel-accounts/privify`
  - Vercel team/scope: `andres-projects-97d8ab21` (`team_zIdrZYy2Nho49wa8DXWJiWws`)
  - This is the production account/team for this repo.
  - Current Vercel project id: `prj_lDe3d1JluQAGjAg7EBhGyYNdgUvY`.
  - Current public URL: `https://iris-tasks-murex.vercel.app`.
- `imandrelucas@gmail.com`
  - CLI username seen locally: `andrezaolucas`
  - Local profile: `$HOME/.vercel-accounts/imandrelucas`
  - Checked on 2026-07-13: this account is logged in and does not list `iris-tasks`.
  - Projects visible in this account at the time of the audit: `utilwave`, `peticao-luan`, `peticao-flanelinha`, `clazzy`.

Never commit Vercel tokens. The profile directories above live outside the repo and contain local auth state only.

## Iris Tasks deploy checklist

Before any production deploy:

```bash
cd /Users/andrelucas/code/iris-tasks
git status --short --branch
npm run build
node scripts/verify-storage.mjs
vercel --global-config "$HOME/.vercel-accounts/privify" whoami
vercel --global-config "$HOME/.vercel-accounts/privify" projects ls
```

Only deploy after confirming the account, project, and env vars:

```bash
vercel --global-config "$HOME/.vercel-accounts/privify" deploy --prod --yes
```

If Vercel asks to link the project, stop and verify the account first. A wrong relink can create a new empty `iris-tasks` project with no env vars.

As of 2026-07-13, deploy recovery conclusion:

- `imandrelucas@gmail.com` does not list `iris-tasks`.
- `andre@privify.com.br` is the matching account/team for this repo (`team_zIdrZYy2Nho49wa8DXWJiWws`).
- The old local project id `prj_ztUoGZfeRwo0pMwV7HSNSljkcD7d` returns `Project not found` in the matching account, so it is stale/deleted/transferred.
- The current visible `iris-tasks` project under `andre@privify.com.br` is `prj_lDe3d1JluQAGjAg7EBhGyYNdgUvY`.
- Production env vars were recreated on 2026-07-13 from local `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Vercel Auth/SSO protection was removed for this project by setting `ssoProtection` to `null` via the official Vercel Projects API, because the restored `murex` alias was otherwise redirecting to Vercel SSO.
- Production deploy `dpl_CF5f5pTGPJv8HEGLfXygqj8ZndGr` was promoted on 2026-07-13 and aliases were restored.
- `https://iris-tasks-murex.vercel.app` responds `HTTP 200` and `/api/translate` returns RU translations.

Useful project references found during the 2026-07-13 audit:

- GitHub repo: `https://github.com/cyterncorp-crypto/iris-tasks.git`
- Old local Vercel project id from `.vercel/project.json`: `prj_ztUoGZfeRwo0pMwV7HSNSljkcD7d`
- Current project under `andre@privify.com.br`: `prj_lDe3d1JluQAGjAg7EBhGyYNdgUvY`
- Public URL: `https://iris-tasks-murex.vercel.app`
