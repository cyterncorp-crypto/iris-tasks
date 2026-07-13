/**
 * Remove do banco URLs de imagens de tarefas cujo arquivo não existe mais no storage.
 * Uso: node scripts/clean-broken-task-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

async function urlExists(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.status === 200;
  } catch {
    return false;
  }
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: tasks, error } = await supabase
  .from("tasks")
  .select("id, title, image_url, image_urls");

if (error) {
  console.error(error.message);
  process.exit(1);
}

const cache = new Map();
async function ok(url) {
  if (!cache.has(url)) cache.set(url, await urlExists(url));
  return cache.get(url);
}

let updated = 0;
let cleared = 0;

for (const task of tasks ?? []) {
  const raw = Array.isArray(task.image_urls)
    ? task.image_urls.filter((u) => typeof u === "string" && u.length > 0)
    : [];
  const current =
    raw.length > 0 ? raw : task.image_url?.trim() ? [task.image_url] : [];
  if (current.length === 0) continue;

  const kept = [];
  for (const url of current) {
    if (await ok(url)) kept.push(url);
  }

  if (kept.length === current.length) continue;

  const { error: upErr } = await supabase
    .from("tasks")
    .update({
      image_urls: kept,
      image_url: kept[0] ?? null,
    })
    .eq("id", task.id);

  if (upErr) {
    console.error("Falha", task.id, upErr.message);
    continue;
  }

  updated++;
  if (kept.length === 0) cleared++;
  console.log(
    `${task.title?.slice(0, 50) ?? task.id}: ${current.length} -> ${kept.length}`
  );
}

console.log(
  `Concluído. Tarefas atualizadas: ${updated} (sem imagens restantes: ${cleared})`
);
