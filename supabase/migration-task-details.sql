-- Detalhes da tarefa: descrição e imagem (execute no SQL Editor do Supabase)

alter table tasks add column if not exists description text;
alter table tasks add column if not exists image_url text;

-- Bucket para imagens das tarefas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-images',
  'task-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "task_images_select" on storage.objects;
drop policy if exists "task_images_insert" on storage.objects;
drop policy if exists "task_images_update" on storage.objects;
drop policy if exists "task_images_delete" on storage.objects;

create policy "task_images_select" on storage.objects for select using (bucket_id = 'task-images');
create policy "task_images_insert" on storage.objects for insert with check (bucket_id = 'task-images');
create policy "task_images_update" on storage.objects for update using (bucket_id = 'task-images');
create policy "task_images_delete" on storage.objects for delete using (bucket_id = 'task-images');
