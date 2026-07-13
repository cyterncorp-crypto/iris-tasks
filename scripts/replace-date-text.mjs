/**
 * Troca 26/07 → 08/08 em todo conteúdo textual das tarefas.
 * Uso: node scripts/replace-date-text.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

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

/** Só o formato escrito 26/07 (e variações com espaços). Não mexe em ISO 2026-07-xx. */
const DATE_RE = /26\s*\/\s*07/g;
const DATE_REPLACEMENT = "08/08";

function replaceInString(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return { value, changed: false };
  DATE_RE.lastIndex = 0;
  return { value: value.replace(DATE_RE, DATE_REPLACEMENT), changed: true };
}

function replaceDeep(value) {
  if (typeof value === "string") {
    const r = replaceInString(value);
    return { value: r.value, changed: r.changed };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const r = replaceDeep(item);
      if (r.changed) changed = true;
      return r.value;
    });
    return { value: next, changed };
  }
  if (value && typeof value === "object") {
    let changed = false;
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      const r = replaceDeep(v);
      if (r.changed) changed = true;
      next[k] = r.value;
    }
    return { value: next, changed };
  }
  return { value, changed: false };
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: tasks, error } = await supabase
  .from("tasks")
  .select("id, title, description, checklist, tags, tag");

if (error) {
  console.error(error.message);
  process.exit(1);
}

let updated = 0;
let replacements = 0;

for (const task of tasks ?? []) {
  const patch = {};
  let taskChanged = false;

  for (const field of ["title", "description", "tag"]) {
    const r = replaceInString(task[field] ?? "");
    if (r.changed) {
      patch[field] = r.value;
      taskChanged = true;
      replacements += (task[field].match(DATE_RE) || []).length;
      DATE_RE.lastIndex = 0;
    }
  }

  for (const field of ["checklist", "tags"]) {
    if (task[field] == null) continue;
    const before = JSON.stringify(task[field]);
    const countBefore = (before.match(DATE_RE) || []).length;
    DATE_RE.lastIndex = 0;
    const r = replaceDeep(task[field]);
    if (r.changed) {
      patch[field] = r.value;
      taskChanged = true;
      replacements += countBefore;
    }
  }

  if (!taskChanged) continue;

  const { error: upErr } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", task.id);

  if (upErr) {
    console.error("Falha", task.id, upErr.message);
    continue;
  }

  updated++;
}

console.log(`Tarefas atualizadas: ${updated}`);
console.log(`Ocorrências trocadas (26/07 → 08/08): ~${replacements}`);

// verificação
const { data: after } = await supabase
  .from("tasks")
  .select("id, title, description, checklist, tags, tag");

let remaining = 0;
for (const t of after ?? []) {
  const blob = JSON.stringify(t);
  const m = blob.match(DATE_RE);
  if (m) remaining += m.length;
}
DATE_RE.lastIndex = 0;
console.log(`Ocorrências 26/07 restantes no banco: ${remaining}`);
