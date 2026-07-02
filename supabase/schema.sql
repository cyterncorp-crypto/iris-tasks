-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)

create type task_status as enum ('em andamento', 'feito', 'nao realizado');
create type task_priority as enum ('baixa', 'media', 'alta');

create table if not exists influencers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists influencers_slug_unique on influencers (slug) where slug is not null;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Nova tarefa',
  description text,
  checklist jsonb not null default '[]'::jsonb,
  image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  influencer_id uuid references influencers(id) on delete set null,
  influencer_name text,
  influencer_photo_url text,
  due_date date,
  status task_status not null default 'em andamento',
  priority task_priority not null default 'media',
  tag text,
  tag_color text,
  tags jsonb not null default '[]'::jsonb,
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists influencers_updated_at on influencers;
create trigger influencers_updated_at
  before update on influencers
  for each row execute function update_updated_at();

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

alter table influencers enable row level security;
alter table tasks enable row level security;

drop policy if exists "influencers_select" on influencers;
drop policy if exists "influencers_insert" on influencers;
drop policy if exists "influencers_update" on influencers;
drop policy if exists "influencers_delete" on influencers;

create policy "influencers_select" on influencers for select using (true);
create policy "influencers_insert" on influencers for insert with check (true);
create policy "influencers_update" on influencers for update using (true);
create policy "influencers_delete" on influencers for delete using (true);

drop policy if exists "tasks_select" on tasks;
drop policy if exists "tasks_insert" on tasks;
drop policy if exists "tasks_update" on tasks;
drop policy if exists "tasks_delete" on tasks;

create policy "tasks_select" on tasks for select using (true);
create policy "tasks_insert" on tasks for insert with check (true);
create policy "tasks_update" on tasks for update using (true);
create policy "tasks_delete" on tasks for delete using (true);

-- Dados de exemplo
insert into influencers (name)
select * from (values
  ('Maria Silva'),
  ('João Santos'),
  ('Ana Costa')
) as v(name)
where not exists (select 1 from influencers limit 1);

insert into tasks (title, influencer_id, due_date, status, priority, progress)
select
  v.title,
  i.id,
  v.due_date::date,
  v.status::task_status,
  v.priority::task_priority,
  v.progress
from (values
  ('Assinar contrato com agência de branding', 'Maria Silva', '2026-07-12', 'feito', 'alta', 100),
  ('Revisar campanha no Instagram', 'João Santos', (current_date + 7)::text, 'em andamento', 'media', 60),
  ('Enviar briefing ao influenciador', 'Ana Costa', (current_date - 3)::text, 'em andamento', 'baixa', 0)
) as v(title, influencer_name, due_date, status, priority, progress)
join influencers i on i.name = v.influencer_name
where not exists (select 1 from tasks limit 1);

-- Storage para fotos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'influencer-photos',
  'influencer-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

drop policy if exists "influencer_photos_select" on storage.objects;
drop policy if exists "influencer_photos_insert" on storage.objects;
drop policy if exists "influencer_photos_update" on storage.objects;
drop policy if exists "influencer_photos_delete" on storage.objects;

create policy "influencer_photos_select" on storage.objects for select using (bucket_id = 'influencer-photos');
create policy "influencer_photos_insert" on storage.objects for insert with check (bucket_id = 'influencer-photos');
create policy "influencer_photos_update" on storage.objects for update using (bucket_id = 'influencer-photos');
create policy "influencer_photos_delete" on storage.objects for delete using (bucket_id = 'influencer-photos');

-- Storage para imagens das tarefas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-images',
  'task-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

drop policy if exists "task_images_select" on storage.objects;
drop policy if exists "task_images_insert" on storage.objects;
drop policy if exists "task_images_update" on storage.objects;
drop policy if exists "task_images_delete" on storage.objects;

create policy "task_images_select" on storage.objects for select using (bucket_id = 'task-images');
create policy "task_images_insert" on storage.objects for insert with check (bucket_id = 'task-images');
create policy "task_images_update" on storage.objects for update using (bucket_id = 'task-images');
create policy "task_images_delete" on storage.objects for delete using (bucket_id = 'task-images');
