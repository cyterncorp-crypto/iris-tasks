-- Múltiplas imagens por tarefa (execute no SQL Editor do Supabase)
-- https://supabase.com/dashboard/project/mjxkozbobrpeylelxtfs/sql/new

alter table tasks add column if not exists image_urls jsonb not null default '[]'::jsonb;

update tasks
set image_urls = jsonb_build_array(image_url)
where image_url is not null
  and trim(image_url) <> ''
  and image_urls = '[]'::jsonb;
