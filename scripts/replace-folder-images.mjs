/**
 * Substitui imagens hospedadas (pasta 2607) pelas correspondentes (2607 (2)).
 * Pareia 1.png→1.png … 7.png→7.png por similaridade visual.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const DIR_OLD = "C:/Users/user/Downloads/2607";
const DIR_NEW = "C:/Users/user/Downloads/2607 (2)";
const PAIR_COUNT = 7;

function loadEnv() {
  const vars = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
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

async function fingerprint(input) {
  // 32x32 grayscale raw — bom para matching mesmo com reencode
  return sharp(input)
    .rotate()
    .resize(32, 32, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();
}

function mse(a, b) {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum / n;
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Carrega pares locais
const pairs = [];
for (let i = 1; i <= PAIR_COUNT; i++) {
  const oldPath = path.join(DIR_OLD, `${i}.png`);
  const newPath = path.join(DIR_NEW, `${i}.png`);
  if (!fs.existsSync(oldPath) || !fs.existsSync(newPath)) {
    console.error(`Par ${i} incompleto`);
    process.exit(1);
  }
  const oldBuf = fs.readFileSync(oldPath);
  const newBuf = fs.readFileSync(newPath);
  const fp = await fingerprint(oldBuf);
  const meta = await sharp(oldBuf).metadata();
  pairs.push({
    i,
    oldBuf,
    newBuf,
    fp,
    oldHash: sha256(oldBuf),
    w: meta.width,
    h: meta.height,
  });
  console.log(`Par ${i}: ${meta.width}x${meta.height} old=${oldBuf.length}b new=${newBuf.length}b`);
}

// Coleta URLs hospedadas
const { data: tasks, error } = await supabase
  .from("tasks")
  .select("id, title, image_url, image_urls");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const urlRefs = new Map();
for (const task of tasks ?? []) {
  const urls =
    Array.isArray(task.image_urls) && task.image_urls.length
      ? task.image_urls
      : task.image_url
        ? [task.image_url]
        : [];
  for (const u of urls) {
    if (!u) continue;
    if (!urlRefs.has(u)) urlRefs.set(u, []);
    urlRefs.get(u).push(task);
  }
}

console.log(`URLs únicas hospedadas: ${urlRefs.size}`);

const hosted = [];
for (const [url, refs] of urlRefs) {
  try {
    const res = await fetch(url);
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    const fp = await fingerprint(buf);
    const meta = await sharp(buf).metadata();
    hosted.push({
      url,
      buf,
      fp,
      hash: sha256(buf),
      w: meta.width,
      h: meta.height,
      refs,
    });
  } catch (e) {
    console.warn("skip", url.slice(-30), e.message);
  }
}

console.log(`Hospedadas baixadas: ${hosted.length}`);

// Para cada par antigo, achar melhor match entre hospedadas (sem reusar a mesma se possível)
const usedHosted = new Set();
const mapping = []; // { pairIndex, hostedUrls[], newUrl }

for (const pair of pairs) {
  // 1) match exato por hash
  let exact = hosted.filter((h) => h.hash === pair.oldHash && !usedHosted.has(h.hash));
  if (exact.length === 0) {
    // também: todas com mesmo hash (cópias)
    exact = hosted.filter((h) => h.hash === pair.oldHash);
  }

  let matchedHashes = new Set();
  if (exact.length > 0) {
    for (const h of exact) matchedHashes.add(h.hash);
    console.log(`Par ${pair.i}: match EXATO (${exact.length} urls)`);
  } else {
    // 2) melhor MSE — e todas as urls com o mesmo hash do melhor
    const scored = hosted
      .map((h) => ({ h, err: mse(pair.fp, h.fp) }))
      .sort((a, b) => a.err - b.err);

    const best = scored[0];
    const second = scored[1];
    console.log(
      `Par ${pair.i}: melhor MSE=${best.err.toFixed(2)} (${best.h.w}x${best.h.h}, ${best.h.refs[0]?.title?.slice(0, 40)})` +
        (second ? ` | 2º=${second.err.toFixed(2)}` : "")
    );

    // threshold: imagens com overlay 26/07 devem ficar bem próximas; fotos diferentes ficam altas
    if (best.err > 800) {
      console.warn(`  ⚠ MSE alto — pulando par ${pair.i} (sem match confiável)`);
      continue;
    }
    // Aceitar também outras hospedadas com MSE muito próximo do melhor (mesmo conteúdo reencoded)
    const threshold = Math.max(best.err * 1.15, best.err + 50);
    for (const s of scored) {
      if (s.err <= threshold || s.h.hash === best.h.hash) {
        matchedHashes.add(s.h.hash);
      } else break;
    }
    // Prefer only the best hash cluster to avoid false positives
    matchedHashes = new Set([best.h.hash]);
  }

  const matchedUrls = hosted.filter((h) => matchedHashes.has(h.hash)).map((h) => h.url);
  for (const h of matchedHashes) usedHosted.add(h);

  // Upload nova imagem
  const dest = `${crypto.randomUUID()}.png`;
  const { error: upErr } = await supabase.storage
    .from("task-images")
    .upload(dest, pair.newBuf, { contentType: "image/png", upsert: false });
  if (upErr) {
    console.error(`Upload falhou par ${pair.i}:`, upErr.message);
    continue;
  }
  const {
    data: { publicUrl: newUrl },
  } = supabase.storage.from("task-images").getPublicUrl(dest);

  mapping.push({ i: pair.i, matchedUrls, newUrl, matchedHashes: [...matchedHashes] });
  console.log(`  → ${matchedUrls.length} URL(s) → ${newUrl.slice(-50)}`);
}

// Aplicar nas tarefas
let tasksUpdated = 0;
let replacements = 0;
const urlToNew = new Map();
for (const m of mapping) {
  for (const u of m.matchedUrls) urlToNew.set(u, m.newUrl);
}

for (const task of tasks ?? []) {
  const raw =
    Array.isArray(task.image_urls) && task.image_urls.length
      ? [...task.image_urls]
      : task.image_url
        ? [task.image_url]
        : [];
  if (!raw.length) continue;

  let changed = false;
  const next = raw.map((u) => {
    if (urlToNew.has(u)) {
      changed = true;
      replacements++;
      return urlToNew.get(u);
    }
    return u;
  });
  if (!changed) continue;

  const { error: updErr } = await supabase
    .from("tasks")
    .update({ image_urls: next, image_url: next[0] ?? null })
    .eq("id", task.id);
  if (updErr) {
    console.error(updErr.message);
    continue;
  }
  tasksUpdated++;
}

console.log(`\nPares aplicados: ${mapping.length}/${PAIR_COUNT}`);
console.log(`Tarefas atualizadas: ${tasksUpdated}`);
console.log(`Substituições de URL: ${replacements}`);

// Remover arquivos antigos do storage
const oldUrls = [...urlToNew.keys()];
for (const oldUrl of oldUrls) {
  const filePath = decodeURIComponent(oldUrl.split("/task-images/")[1] ?? "");
  if (!filePath) continue;
  const { error: delErr } = await supabase.storage.from("task-images").remove([filePath]);
  if (delErr) console.warn("del", filePath, delErr.message);
  else console.log("removido", filePath);
}

console.log("Concluído.");
