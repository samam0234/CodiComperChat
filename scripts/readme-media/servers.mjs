// 데모 전용 DB를 준비하고 AI·API·웹·콘솔을 띄운다. Ctrl+C로 모두 끈다
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { AUTH_SECRET, DB_NAME, PORTS, ROOT, TMP, URLS, databaseUrl } from "./env.mjs";

const db = databaseUrl();
const admin = new URL(db);
admin.pathname = "/postgres";
const client = new pg.Client({ connectionString: admin.toString() });
await client.connect();
await client.query(`drop database if exists ${DB_NAME} with (force)`);
await client.query(`create database ${DB_NAME}`);
await client.end();

const api = join(ROOT, "apps", "api");
const shell = process.platform === "win32";
const dbEnv = { ...process.env, DATABASE_URL: db.toString() };
execFileSync("npx", ["prisma", "migrate", "deploy"], { cwd: api, stdio: "inherit", env: dbEnv, shell });
execFileSync("npm", ["run", "prisma:seed", "--silent"], { cwd: api, stdio: "inherit", env: dbEnv, shell });

// 공식 캐릭터의 지식 파일만 복사한다 (공방 캐릭터 파일은 쓰지 않는다)
const personas = join(TMP, "personas");
rmSync(TMP, { recursive: true, force: true });
mkdirSync(personas, { recursive: true });
for (const name of ["유지성.json", "이세연.json"]) {
  const from = join(api, "data", "personas", name);
  if (existsSync(from)) copyFileSync(from, join(personas, name));
}

const next = join(ROOT, "node_modules", "next", "dist", "bin", "next");
const python = join(ROOT, "services", "ai", shell ? ".venv/Scripts/python.exe" : ".venv/bin/python");
const children = [
  spawn(python, ["-m", "uvicorn", "app.main:app", "--port", String(PORTS.ai)], {
    cwd: join(ROOT, "services", "ai"),
    stdio: "inherit",
  }),
  spawn(process.execPath, ["dist-verify/main.js"], {
    cwd: api,
    stdio: "inherit",
    env: {
      ...dbEnv,
      PORT: String(PORTS.api),
      AI_BASE_URL: URLS.ai,
      AUTH_SECRET,
      PERSONA_DATA_DIR: personas,
      MAIL_OUTBOX_DIR: join(TMP, "mail"),
      MAIL_SMTP_URL: "",
      WEB_BASE_URL: URLS.web,
      BILLING_PROVIDER: "mock",
      TOSS_SECRET_KEY: "",
      TOSS_CLIENT_KEY: "",
      PRO_CLICK: "on",
      ADULT_MODE: "off",
      RATE_LIMIT_SCALE: "1000",
    },
  }),
  ...[
    ["apps/web", PORTS.web],
    ["console", PORTS.console],
  ].map(([app, port]) =>
    spawn(process.execPath, [next, "start", "-p", String(port)], {
      cwd: join(ROOT, app),
      stdio: "inherit",
      env: { ...process.env, API_BASE_URL: URLS.api, WEB_BASE_URL: URLS.web, NEXT_DIST_DIR: ".next-e2e" },
    }),
  ),
];
const stop = () => {
  for (const child of children) child.kill();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
