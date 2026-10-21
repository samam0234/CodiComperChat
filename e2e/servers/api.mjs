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
    // 돈이 오가지 않는 가짜 결제. 개발자의 토스 키가 환경에 있어도 쓰지 않는다
    BILLING_PROVIDER: "mock",
    TOSS_SECRET_KEY: "",
    TOSS_CLIENT_KEY: "",
    // 짧은 시간에 가입·요청을 많이 하는 시험이라 한도를 크게 곱한다. 한도 동작은 apps/api의 통합 테스트(security/rate-limit.http.spec.ts)가 본다
    RATE_LIMIT_SCALE: process.env.RATE_LIMIT_SCALE || '1000',
    // 서버 여러 대용 DB 저장소로 돌려 그 경로도 매번 지나가게 한다
    RATE_LIMIT_STORE: "db",
    // 강화 무료 모델의 하루 한도(운영은 30)를 줄여 한도에 닿는 경로를 짧게 시험한다
    MODEL_ENHANCED_DAILY_LIMIT: "2",
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill());
