// ADULT_MODE=off로 서버를 띄워 성인 입구가 숨는지 본다. 앞선 화면 빌드가 있으면 다시 빌드하지 않는다
import { execSync } from "node:child_process";
import { ROOT } from "./env.mjs";

const env = { ...process.env, ADULT_MODE: "off", E2E_SKIP_BUILD: "1" };
execSync("node e2e/prepare.mjs", { cwd: ROOT, stdio: "inherit", env });
execSync("npx playwright test -c e2e/playwright.config.ts tests/adult-off.spec.ts", { cwd: ROOT, stdio: "inherit", env });
