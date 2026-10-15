import { defineConfig } from "@playwright/test";
import { join } from "node:path";
import { ROOT, URLS } from "./env.mjs";

// 웹 자동 테스트. 실행: `npm run test:e2e` (준비 → 서버 3개 기동 → 테스트).
// 서버는 모두 e2e 전용 포트·DB·가짜 LLM이라 쓰시는 개발 서버와 같이 켜 둬도 된다.
export default defineConfig({
  testDir: "./tests",
  outputDir: join(ROOT, "e2e", ".tmp", "test-results"),
  // 같은 DB를 쓰므로 한 번에 하나씩. 테스트마다 새 계정을 만들어 서로 간섭하지 않는다
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: URLS.web,
    // 브라우저를 따로 내려받지 않고 설치된 Chrome을 쓴다
    channel: "chrome",
    locale: "ko-KR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    { command: "node e2e/servers/ai.mjs", url: `${URLS.ai}/health`, cwd: ROOT, timeout: 60_000, reuseExistingServer: false },
    { command: "node e2e/servers/api.mjs", url: `${URLS.api}/health`, cwd: ROOT, timeout: 60_000, reuseExistingServer: false },
    { command: "node e2e/servers/web.mjs", url: URLS.web, cwd: ROOT, timeout: 180_000, reuseExistingServer: false },
  ],
});
