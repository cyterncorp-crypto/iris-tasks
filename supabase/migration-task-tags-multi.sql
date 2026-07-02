-- Suporte a até 4 tags por tarefa (array jsonb)
alter table tasks add column if not exists tags jsonb not null default '[]'::jsonb;

-- Migra tag única antiga para o array
update tasks
set tags = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'label', trim(tag),
    'color', coalesce(nullif(trim(tag_color), ''), '#7c3aed')
  )
)
where jsonb_array_length(tags) = 0
  and tag is not null
  and trim(tag) <> '';

-- Migra prioridade legada se ainda não houver tags
update tasks
set tags = jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid()::text, 'label', 'Baixa', 'color', '#64748b')
)
where jsonb_array_length(tags) = 0 and priority = 'baixa';

update tasks
set tags = jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid()::text, 'label', 'Média', 'color', '#5b5bd6')
)
where jsonb_array_length(tags) = 0 and priority = 'media';

update tasks
set tags = jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid()::text, 'label', 'Alta', 'color', '#7c3aed')
)
where jsonb_array_length(tags) = 0 and priority = 'alta';
