import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

const env = loadEnv();
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const url = env.NEXT_PUBLIC_SUPABASE_URL;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.");
  process.exit(1);
}

const supabase = createClient(url, key);

const checks = [
  {
    name: "tasks.image_url/image_urls",
    run: () => supabase.from("tasks").select("description,image_url,image_urls").limit(1),
  },
  {
    name: "storage.task-images",
    run: () => supabase.storage.from("task-images").list("", { limit: 1 }),
  },
  {
    name: "storage.influencer-photos",
    run: () => supabase.storage.from("influencer-photos").list("", { limit: 1 }),
  },
];

let failed = false;
for (const check of checks) {
  const { data, error } = await check.run();
  if (error) {
    failed = true;
    console.log(`${check.name}: FAIL - ${error.message}`);
  } else {
    const count = Array.isArray(data) ? data.length : 0;
    console.log(`${check.name}: OK (${count} item${count === 1 ? "" : "s"} verificado${count === 1 ? "" : "s"})`);
  }
}

if (failed) process.exit(1);
