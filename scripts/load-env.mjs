import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const envPath = path.join(projectRoot, ".env.local");

function cleanValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function loadEnv(file = envPath) {
  if (!fs.existsSync(file)) return {};

  const vars = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = cleanValue(trimmed.slice(eq + 1));
  }
  return vars;
}
