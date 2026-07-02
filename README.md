# Sayyo Tasks

Sistema de tarefas para influenciadores, com Supabase, checklist editável, tags coloridas e tradução PT/RU.

## Funcionalidades

- Quadro de tarefas agrupado por data de entrega
- Perfis de influenciadores com foto e barra de progresso geral
- Checklist com formatação (`#` títulos, `**negrito**`, listas `*`)
- Até 4 tags por tarefa (texto + cor)
- URLs amigáveis: `/influenciadores/nome-do-influenciador`
- Interface em português com tradução dinâmica para russo (PT → RU)
- Upload de fotos (influenciadores e tarefas) via Supabase Storage

## Stack

- Next.js 15 + TypeScript
- Supabase (PostgreSQL + Storage)
- CSS Modules

## Setup local

### 1. Clonar e instalar

```bash
git clone https://github.com/SEU-USUARIO/iris-tasks.git
cd iris-tasks
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha no [painel do Supabase](https://supabase.com/dashboard) → Settings → API:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (pública) |

### 3. Banco de dados (Supabase SQL Editor)

**Projeto novo:** execute todo o arquivo `supabase/schema.sql`.

**Projeto existente:** execute as migrações que ainda não rodou, na ordem:

1. `migration-influencers.sql`
2. `migration-storage.sql`
3. `migration-checklist.sql`
4. `migration-task-details.sql`
5. `migration-task-tag.sql`
6. `migration-task-tags-multi.sql`
7. `migration-influencer-slug.sql`
8. `migration-task-images-only.sql` (se imagens de tarefa não funcionarem)
9. `migration-fix-task-images-policies.sql` (se upload falhar)

### 4. Rodar

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run setup:storage` | Cria bucket `task-images` via API (opcional) |

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Todas as tarefas |
| `/influenciadores` | Gerenciar influenciadores |
| `/influenciadores/[slug]` | Perfil do influenciador |

## Publicar no GitHub

```bash
# Na pasta do projeto (se ainda não tiver git)
git init
git add .
git commit -m "Initial commit: Sayyo Tasks"

# Crie o repositório em https://github.com/new (sem README)
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/iris-tasks.git
git push -u origin main
```

> **Importante:** `.env.local` está no `.gitignore` e **não** deve ser enviado ao GitHub.

## Deploy (Vercel)

1. Importe o repositório em [vercel.com](https://vercel.com)
2. Adicione as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

A API `/api/translate` funciona no servidor Next.js sem chave extra (usa provedores gratuitos).

## Estrutura

```
src/
  app/              # Rotas Next.js
  components/       # UI (TaskBoard, modal, checklist, tags…)
  lib/              # Supabase, i18n, utils
supabase/           # Schema e migrações SQL
scripts/            # Dev, build e setup
```
