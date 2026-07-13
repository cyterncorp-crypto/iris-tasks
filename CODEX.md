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
  - Local profile: `$HOME/.vercel-accounts/imandrelucas`
  - Expected account for the original Iris Tasks / Sayyo Tasks production project.

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

Useful project references found during the 2026-07-13 audit:

- GitHub repo: `https://github.com/cyterncorp-crypto/iris-tasks.git`
- Old local Vercel project id from `.vercel/project.json`: `prj_ztUoGZfeRwo0pMwV7HSNSljkcD7d`
- Empty/new project seen under `andre@privify.com.br`: `prj_lDe3d1JluQAGjAg7EBhGyYNdgUvY`
- Old URL checked: `https://iris-tasks-murex.vercel.app`

