-- Slug na URL do perfil: /influenciadores/nome-do-influenciador
alter table influencers add column if not exists slug text;

create unique index if not exists influencers_slug_unique on influencers (slug) where slug is not null;

-- Preencher slugs a partir dos nomes (ajuste manual se houver duplicatas)
update influencers
set slug = lower(
  regexp_replace(
    regexp_replace(
      trim(
        translate(
          name,
          'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
          'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
        )
      ),
      '[^a-zA-Z0-9\u0400-\u04FF]+',
      '-',
      'g'
    ),
    '(^-|-$)',
    '',
    'g'
  )
)
where slug is null or slug = '';
