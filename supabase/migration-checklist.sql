-- Checklist em "O que fazer" (execute no SQL Editor do Supabase)
-- https://supabase.com/dashboard/project/mjxkozbobrpeylelxtfs/sql/new

alter table tasks add column if not exists checklist jsonb not null default '[]'::jsonb;

-- Migra descrições antigas para o primeiro item da checklist
update tasks
set checklist = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'text', description,
    'done', false
  )
)
where description is not null
  and trim(description) <> ''
  and checklist = '[]'::jsonb;
