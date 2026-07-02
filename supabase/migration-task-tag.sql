-- Substitui prioridade fixa por tag personalizável (texto + cor)
alter table tasks add column if not exists tag text;
alter table tasks add column if not exists tag_color text;

-- Migra valores antigos de prioridade para tags
update tasks
set tag = 'Baixa', tag_color = '#64748b'
where tag is null and priority = 'baixa';

update tasks
set tag = 'Média', tag_color = '#5b5bd6'
where tag is null and priority = 'media';

update tasks
set tag = 'Alta', tag_color = '#7c3aed'
where tag is null and priority = 'alta';
