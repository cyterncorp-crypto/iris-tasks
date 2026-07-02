import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
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
    console.log("✓ Cache .next limpo antes do build");
  }
}

console.log("Build Sayyo Tasks…");
killPorts();
cleanCache();

const result = spawnSync("npx", ["next", "build"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
