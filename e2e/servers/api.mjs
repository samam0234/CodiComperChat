// e2e용 Nest: 검증용 빌드(dist-verify)를 e2e DB·가짜 LLM 쪽 FastAPI에 붙여 띄운다.
// 개발 서버가 쓰는 dist를 건드리지 않는다 (build:verify는 따로 출력한다)
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { AUTH_SECRET, E2E_DB, PERSONA_DIR, PORTS, ROOT, URLS } from "../env.mjs";

mkdirSync(PERSONA_DIR, { recursive: true });

const child = spawn(process.execPath, ["dist-verify/main.js"], {
  cwd: join(ROOT, "apps", "api"),
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(PORTS.api),
    DATABASE_URL: E2E_DB,
    AI_BASE_URL: URLS.ai,
    AUTH_SECRET,
    PERSONA_DATA_DIR: PERSONA_DIR,
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill());
