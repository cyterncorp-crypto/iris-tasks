/**
 * Soma N dias a due_date de todas as tarefas (com data).
 * Uso: node scripts/shift-due-dates.mjs [dias]
 * Ex.: node scripts/shift-due-dates.mjs 13
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

const days = Number(process.argv[2] ?? 13);

function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: tasks, error } = await supabase
  .from("tasks")
  .select("id, due_date")
  .not("due_date", "is", null);

if (error) {
  console.error("Erro ao buscar tarefas:", error.message);
  process.exit(1);
}

const byDate = new Map();
for (const t of tasks) {
  if (!byDate.has(t.due_date)) byDate.set(t.due_date, 0);
  byDate.set(t.due_date, byDate.get(t.due_date) + 1);
}

const oldDates = [...byDate.keys()].sort();
console.log(`Tarefas com data: ${tasks.length}`);
console.log(`Datas atuais: ${oldDates.join(", ")}`);
console.log(`Somando ${days} dia(s)...`);

// Atualizar das datas mais recentes para as mais antigas,
// para não sobrescrever grupos que ainda não foram processados.
for (const oldDate of oldDates.reverse()) {
  const newDate = addDays(oldDate, days);
  const { data: updated, error: upErr } = await supabase
    .from("tasks")
    .update({ due_date: newDate })
    .eq("due_date", oldDate)
    .select("id");

  if (upErr) {
    console.error(`Erro ${oldDate} -> ${newDate}:`, upErr.message);
    process.exit(1);
  }
  console.log(`${oldDate} -> ${newDate} (${updated?.length ?? 0} tarefas)`);
}

const { data: after } = await supabase
  .from("tasks")
  .select("due_date")
  .not("due_date", "is", null);

const datesAfter = [...new Set((after ?? []).map((t) => t.due_date))].sort();
console.log(`Concluído. Datas no banco: ${datesAfter.join(", ")}`);
