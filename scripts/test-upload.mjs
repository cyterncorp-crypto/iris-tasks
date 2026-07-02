import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

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
