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
  - This account can see an empty/new `iris-tasks` project created by accidental relink.
  - Do not deploy production from this account unless the project/env vars are intentionally configured.
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
vercel --global-config "$HOME/.vercel-accounts/imandrelucas" whoami
vercel --global-config "$HOME/.vercel-accounts/imandrelucas" env ls
```

Only deploy after confirming the account, project, and env vars:

```bash
vercel --global-config "$HOME/.vercel-accounts/imandrelucas" deploy --prod --yes
```

If Vercel asks to link the project, stop and verify the account first. A wrong relink can create a new empty `iris-tasks` project with no env vars.

As of 2026-07-13, the original Iris Tasks / Sayyo Tasks production project was not found in either visible account:

- `andre@privify.com.br`
- `imandrelucas@gmail.com`

Do not run production deploy until the correct Vercel project/account is identified or production env vars are intentionally recreated in a new project.

Useful project references found during the 2026-07-13 audit:

- GitHub repo: `https://github.com/cyterncorp-crypto/iris-tasks.git`
- Old local Vercel project id from `.vercel/project.json`: `prj_ztUoGZfeRwo0pMwV7HSNSljkcD7d`
- Empty/new project seen under `andre@privify.com.br`: `prj_lDe3d1JluQAGjAg7EBhGyYNdgUvY`
- Old URL checked: `https://iris-tasks-murex.vercel.app`
