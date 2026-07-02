import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3000;
const PORTS = [3000, 3001, 3002];

function killPorts() {
  if (process.platform !== "win32") return;

  for (const port of PORTS) {
    try {
      execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: "ignore" }
      );
    } catch {
      // porta livre
    }
  }
}

function cleanCache() {
  const nextDir = path.join(projectRoot, ".next");
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("✓ Cache .next limpo");
  }
}

console.log("Iniciando Sayyo Tasks…");
killPorts();
cleanCache();
console.log(`✓ Servidor em http://localhost:${PORT}\n`);

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
