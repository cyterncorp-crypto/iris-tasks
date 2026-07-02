-- Storage para fotos dos influenciadores (execute no SQL Editor do Supabase)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'influencer-photos',
  'influencer-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "influencer_photos_select" on storage.objects;
drop policy if exists "influencer_photos_insert" on storage.objects;
drop policy if exists "influencer_photos_update" on storage.objects;
drop policy if exists "influencer_photos_delete" on storage.objects;

create policy "influencer_photos_select"
  on storage.objects for select
  using (bucket_id = 'influencer-photos');

create policy "influencer_photos_insert"
  on storage.objects for insert
  with check (bucket_id = 'influencer-photos');

create policy "influencer_photos_update"
  on storage.objects for update
  using (bucket_id = 'influencer-photos');

create policy "influencer_photos_delete"
  on storage.objects for delete
  using (bucket_id = 'influencer-photos');
