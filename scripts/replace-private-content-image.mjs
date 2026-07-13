/**
 * Substitui a arte PRIVATE CONTENT 26/07 pela 08/08 em todas as tarefas.
 * Uso: node scripts/replace-private-content-image.mjs
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

const ASSETS = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-Users-user-Projects-iris-tasks/assets"
);
const OLD_IMAGE = path.join(
  ASSETS,
  "c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_6f1dc698f05c2b2cadd1c3f65eb5e539_images_PRIVATE_CONTENT-a4823c71-39bb-4914-8790-4cb3d88ddebc.png"
);
const NEW_IMAGE = path.join(
  ASSETS,
  "c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_6f1dc698f05c2b2cadd1c3f65eb5e539_images_private_c-8ddbdb2f-d499-43e7-8873-c4ed8d7bd770.png"
);
const STORED_OLD = path.join(root, "scripts/_img-audit/f978cd553f86.png");

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

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const oldHashes = new Set([
  sha256(fs.readFileSync(OLD_IMAGE)),
  sha256(fs.readFileSync(STORED_OLD)),
]);

console.log("Hashes da arte antiga (26/07):", [...oldHashes].map((h) => h.slice(0, 12)));

// Upload da nova arte
const newBuf = fs.readFileSync(NEW_IMAGE);
const destPath = `${crypto.randomUUID()}.png`;
const { error: upErr } = await supabase.storage
  .from("task-images")
  .upload(destPath, newBuf, {
    contentType: "image/png",
    cacheControl: "3600",
    upsert: false,
  });

if (upErr) {
  console.error("Falha no upload:", upErr.message);
  process.exit(1);
}

const {
  data: { publicUrl: newUrl },
} = supabase.storage.from("task-images").getPublicUrl(destPath);

console.log("Nova imagem:", newUrl);

const { data: tasks, error } = await supabase
  .from("tasks")
  .select("id, title, image_url, image_urls");

if (error) {
  console.error(error.message);
  process.exit(1);
}

const hashCache = new Map();
async function urlHash(url) {
  if (hashCache.has(url)) return hashCache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      hashCache.set(url, null);
      return null;
    }
    const h = sha256(Buffer.from(await res.arrayBuffer()));
    hashCache.set(url, h);
    return h;
  } catch {
    hashCache.set(url, null);
    return null;
  }
}

let updated = 0;
let replacements = 0;
const oldUrlsSeen = new Set();

for (const task of tasks ?? []) {
  const raw =
    Array.isArray(task.image_urls) && task.image_urls.length > 0
      ? [...task.image_urls]
      : task.image_url
        ? [task.image_url]
        : [];
  if (raw.length === 0) continue;

  let changed = false;
  const next = [];
  for (const url of raw) {
    const h = await urlHash(url);
    if (h && oldHashes.has(h)) {
      oldUrlsSeen.add(url);
      next.push(newUrl);
      changed = true;
      replacements++;
    } else {
      next.push(url);
    }
  }

  if (!changed) continue;

  const { error: updErr } = await supabase
    .from("tasks")
    .update({
      image_urls: next,
      image_url: next[0] ?? null,
    })
    .eq("id", task.id);

  if (updErr) {
    console.error("Falha", task.id, updErr.message);
    continue;
  }

  updated++;
  console.log("OK:", task.title?.slice(0, 60));
}

console.log(`\nTarefas atualizadas: ${updated}`);
console.log(`Substituições: ${replacements}`);
console.log(`URLs antigas distintas: ${oldUrlsSeen.size}`);

// Remove arquivos antigos do storage se não forem mais referenciados
for (const oldUrl of oldUrlsSeen) {
  const marker = "/storage/v1/object/public/task-images/";
  const filePath = decodeURIComponent(oldUrl.split(marker)[1] ?? "");
  if (!filePath) continue;
  const { error: delErr } = await supabase.storage
    .from("task-images")
    .remove([filePath]);
  console.log(
    delErr ? `Não removeu ${filePath}: ${delErr.message}` : `Removido do storage: ${filePath}`
  );
}
