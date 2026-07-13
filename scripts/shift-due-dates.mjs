/**
 * Soma N dias a due_date de todas as tarefas (com data).
 * Uso: node scripts/shift-due-dates.mjs [dias]
 * Ex.: node scripts/shift-due-dates.mjs 13
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const days = Number(process.argv[2] ?? 13);

function loadEnv() {
  const vars = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

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
