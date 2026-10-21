// e2e가 쓰는 포트·DB·경로. 쓰시는 개발 서버(3000/4000/8000)·개발 DB와 겹치지 않게 모두 따로 둔다.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const PORTS = { web: 3101, console: 3102, api: 4101, ai: 8101 };
export const URLS = {
  web: `http://localhost:${PORTS.web}`,
  console: `http://localhost:${PORTS.console}`,
  api: `http://localhost:${PORTS.api}`,
  ai: `http://localhost:${PORTS.ai}`,
};

const E2E_DB_NAME = "codicomperchat_e2e";

// 개발 DB 주소(apps/api/.env의 DATABASE_URL)에서 데이터베이스 이름만 e2e용으로 바꾼다 — 비밀번호를 코드에 적지 않는다.
// 다른 DB를 쓰려면 E2E_DATABASE_URL을 지정한다
function e2eDatabaseUrl() {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL;
  const envFile = join(ROOT, "apps", "api", ".env");
  const match = existsSync(envFile) ? readFileSync(envFile, "utf8").match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m) : null;
  if (!match) throw new Error("e2e: apps/api/.env의 DATABASE_URL을 찾을 수 없다. E2E_DATABASE_URL을 지정하세요.");
  const url = new URL(match[1]);
  url.pathname = `/${E2E_DB_NAME}`;
  return url.toString();
}

export const E2E_DB = e2eDatabaseUrl();
// 실제로 쓰는 데이터베이스 이름 (E2E_DATABASE_URL을 주면 그 주소의 이름). prepare.mjs가 없으면 만든다
export const E2E_DB_NAME_EXPORT = decodeURIComponent(new URL(E2E_DB).pathname.slice(1));
if (!/^[A-Za-z0-9_]+$/.test(E2E_DB_NAME_EXPORT)) throw new Error(`e2e: 데이터베이스 이름은 영문·숫자·_만 쓴다 (${E2E_DB_NAME_EXPORT})`);

export const AUTH_SECRET = "e2e-only-secret-e2e-only-secret-e2e-only-secret-123456";
export const PERSONA_DIR = join(ROOT, "e2e", ".tmp", "personas");
export const NEXT_DIST_DIR = ".next-e2e";
// 메일은 실제로 보내지 않고 이 폴더에 JSON으로 쌓는다 (helpers.ts의 latestMail이 읽는다)
export const MAIL_DIR = join(ROOT, "e2e", ".tmp", "mail");
