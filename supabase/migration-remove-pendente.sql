-- Remove status "pendente" — execute no SQL Editor do Supabase

UPDATE tasks SET status = 'em andamento' WHERE status = 'pendente';

ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'em andamento';
