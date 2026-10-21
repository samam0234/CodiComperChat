// e2e용 운영 콘솔(Next 개발 서버): 별도 빌드 폴더(.next-e2e)와 포트를 쓰고 e2e API에 붙는다
import { spawn } from "node:child_process";
import { join } from "node:path";
import { NEXT_DIST_DIR, PORTS, ROOT, URLS } from "../env.mjs";

const bin = join(ROOT, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [bin, "dev", "-p", String(PORTS.console)], {
  cwd: join(ROOT, "console"),
  stdio: "inherit",
  env: { ...process.env, API_BASE_URL: URLS.api, WEB_BASE_URL: URLS.web, NEXT_DIST_DIR },
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill());
