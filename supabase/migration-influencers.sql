-- Migração: adiciona influenciadores (execute se já rodou o schema antigo)

create table if not exists influencers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists influencers_updated_at on influencers;
create trigger influencers_updated_at
  before update on influencers
  for each row execute function update_updated_at();

alter table influencers enable row level security;

drop policy if exists "influencers_select" on influencers;
drop policy if exists "influencers_insert" on influencers;
drop policy if exists "influencers_update" on influencers;
drop policy if exists "influencers_delete" on influencers;

create policy "influencers_select" on influencers for select using (true);
create policy "influencers_insert" on influencers for insert with check (true);
create policy "influencers_update" on influencers for update using (true);
create policy "influencers_delete" on influencers for delete using (true);

-- Coluna FK em tasks
alter table tasks add column if not exists influencer_id uuid references influencers(id) on delete set null;

-- Migrar dados antigos (nome + foto) para influencers
insert into influencers (name, photo_url)
select distinct influencer_name, influencer_photo_url
from tasks
where influencer_name is not null
  and influencer_name <> ''
  and not exists (
    select 1 from influencers i where i.name = tasks.influencer_name
  );

update tasks t
set influencer_id = i.id
from influencers i
where t.influencer_name = i.name
  and t.influencer_id is null;

-- Dados de exemplo (sem foto — faça upload na aba Influenciadores)
insert into influencers (name)
select * from (values
  ('Maria Silva'),
  ('João Santos'),
  ('Ana Costa')
) as v(name)
where not exists (select 1 from influencers limit 1);
