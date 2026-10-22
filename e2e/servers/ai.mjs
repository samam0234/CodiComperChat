// e2e용 FastAPI: 가짜 LLM(LLM_FAKE=1)으로 띄운다 — 모델 없이 빠르고 같은 응답
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PORTS, ROOT } from "../env.mjs";

const cwd = join(ROOT, "services", "ai");
const python = [join(cwd, ".venv", "Scripts", "python.exe"), join(cwd, ".venv", "bin", "python")].find(existsSync);
if (!python) {
  console.error("services/ai/.venv가 없다. services/ai/README.md의 설치 순서를 먼저 따르세요.");
  process.exit(1);
}

const child = spawn(python, ["-m", "uvicorn", "app.main:app", "--port", String(PORTS.ai)], {
  cwd,
  stdio: "inherit",
  env: { ...process.env, LLM_FAKE: "1" },
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill());
