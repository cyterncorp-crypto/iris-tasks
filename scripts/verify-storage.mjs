import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();

const headers = { apikey: key, Authorization: `Bearer ${key}` };

const bucketRes = await fetch(`${url}/storage/v1/bucket/task-images`, { headers });
const bucketBody = await bucketRes.text();
console.log("bucket:", bucketRes.status, bucketBody);

const colsRes = await fetch(`${url}/rest/v1/tasks?select=description,image_url&limit=1`, { headers });
const colsBody = await colsRes.text();
console.log("columns:", colsRes.status, colsBody.slice(0, 300));

const listRes = await fetch(`${url}/storage/v1/object/list/task-images`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ prefix: "", limit: 1 }),
});
const listBody = await listRes.text();
console.log("list:", listRes.status, listBody.slice(0, 200));
