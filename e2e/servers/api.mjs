// e2e용 Nest: 검증용 빌드(dist-verify)를 e2e DB·가짜 LLM 쪽 FastAPI에 붙여 띄운다.
// 개발 서버가 쓰는 dist를 건드리지 않는다 (build:verify는 따로 출력한다)
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { AUTH_SECRET, E2E_DB, MAIL_DIR, PERSONA_DIR, PORTS, ROOT, URLS } from "../env.mjs";

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
    MAIL_OUTBOX_DIR: MAIL_DIR,
    MAIL_SMTP_URL: "",
    WEB_BASE_URL: URLS.web,
    // 짧은 시간에 가입·요청을 많이 하는 시험이라 한도를 크게 곱한다. 한도 동작은 apps/api의 통합 테스트(security/rate-limit.http.spec.ts)가 본다
    RATE_LIMIT_SCALE: process.env.RATE_LIMIT_SCALE ?? '1000',
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill());
