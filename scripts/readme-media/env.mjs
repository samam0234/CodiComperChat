// README 그림·영상용 데모 환경. 개발 서버·개발 DB·e2e와 겹치지 않는다
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PORTS = { web: 3201, console: 3202, api: 4201, ai: 8201 };
export const URLS = {
  web: `http://localhost:${PORTS.web}`,
  console: `http://localhost:${PORTS.console}`,
  api: `http://localhost:${PORTS.api}`,
  ai: `http://127.0.0.1:${PORTS.ai}`,
};
export const OUT = join(ROOT, "docs", ".assets", "readme");
export const TMP = join(ROOT, "e2e", ".tmp", "readme-media");
export const AUTH_SECRET = "readme-media-only-secret-readme-media-only-secret-1234";
export const DB_NAME = "codicomperchat_readme";

// 개발 DB 주소에서 데이터베이스 이름만 바꾼다 (비밀번호를 코드에 두지 않는다)
export function databaseUrl() {
  const file = join(ROOT, "apps", "api", ".env");
  const found = existsSync(file) ? readFileSync(file, "utf8").match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m) : null;
  if (!found) throw new Error("apps/api/.env의 DATABASE_URL을 찾을 수 없다");
  const url = new URL(found[1]);
  url.pathname = `/${DB_NAME}`;
  return url;
}
