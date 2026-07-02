/**
 * Cria o bucket task-images via API (requer SUPABASE_SERVICE_ROLE_KEY no .env.local)
 * Uso: node scripts/setup-task-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const vars = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.log(`
Bucket "task-images" não existe no Supabase.

Execute o SQL manualmente:

1. Abra: https://supabase.com/dashboard/project/mjxkozbobrpeylelxtfs/sql/new
2. Cole o conteúdo de: supabase/migration-task-images-only.sql
3. Clique em "Run"

(Opcional) Para automatizar no futuro, adicione ao .env.local:
  SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
  (Settings → API → service_role no painel do Supabase)
`);
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function createBucket() {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: "task-images",
      name: "task-images",
      public: true,
      file_size_limit: 5242880,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    }),
  });

  if (res.ok) {
    console.log("✓ Bucket task-images criado");
    return;
  }

  const body = await res.text();
  if (body.includes("already exists") || res.status === 409) {
    console.log("✓ Bucket task-images já existe");
    return;
  }

  throw new Error(`Falha ao criar bucket (${res.status}): ${body}`);
}

async function checkBucket() {
  const res = await fetch(`${url}/storage/v1/bucket/task-images`, { headers });
  return res.ok;
}

async function main() {
  if (await checkBucket()) {
    console.log("✓ Bucket task-images já está disponível");
    console.log("\nSe o upload ainda falhar, execute as políticas SQL em:");
    console.log("  supabase/migration-task-images-only.sql");
    return;
  }

  await createBucket();
  console.log("\nAgora execute as políticas SQL no Supabase (se o upload der erro de permissão):");
  console.log("  supabase/migration-task-images-only.sql");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
