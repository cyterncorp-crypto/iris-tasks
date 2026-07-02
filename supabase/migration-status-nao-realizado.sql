-- Adiciona status "nao realizado" (execute no SQL Editor do Supabase)
-- https://supabase.com/dashboard/project/mjxkozbobrpeylelxtfs/sql/new

alter type task_status add value if not exists 'nao realizado';
