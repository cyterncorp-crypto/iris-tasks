import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env.mjs";

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

// 1x1 red PNG
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

for (const bucket of ["influencer-photos", "task-images"]) {
  const path = `test-${Date.now()}.png`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, png, {
    contentType: "image/png",
    upsert: false,
  });
  console.log(bucket, error ? `FAIL: ${error.message}` : `OK: ${data?.path}`);
  if (!error) await supabase.storage.from(bucket).remove([path]);
}
