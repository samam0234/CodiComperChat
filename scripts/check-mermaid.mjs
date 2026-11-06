// node scripts/check-mermaid.mjs — 저장소의 모든 ```mermaid 블록을 실제 mermaid로 파싱해 GitHub에서 그려지는지 본다
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
// 인터넷이 필요하다(mermaid를 jsdelivr에서 불러온다). GitHub가 그리는 mermaid와 같은 11판으로 파싱만 한다

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const files = execFileSync("git", ["ls-files", "*.md"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !f.startsWith("docs/branchs/commits/"));
const blocks = [];
for (const f of files) {
  const text = readFileSync(`${ROOT}/${f}`, "utf8").replace(/\r\n/g, "\n");
  const re = /```mermaid\n([\s\S]*?)\n```/g;
  let m;
  while ((m = re.exec(text))) blocks.push({ file: f, code: m[1] });
}
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.setContent(`<!doctype html><script type="module">import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs"; mermaid.initialize({startOnLoad:false}); window.mermaid = mermaid; window.ready = true;</script>`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const results = await page.evaluate(async (list) => {
  const out = [];
  for (const b of list) {
    try {
      await window.mermaid.parse(b.code);
      out.push(null);
    } catch (e) {
      out.push(String(e?.message ?? e).split("\n").slice(0, 3).join(" | "));
    }
  }
  return out;
}, blocks);
await browser.close();
let bad = 0;
results.forEach((r, i) => {
  if (r) {
    bad++;
    console.log(`NG ${blocks[i].file}: ${r}\n   첫 줄: ${blocks[i].code.split("\n")[0]}`);
  }
});
console.log(`mermaid 블록 ${blocks.length}개, 파일 ${new Set(blocks.map((b) => b.file)).size}개, 실패 ${bad}개`);
process.exit(bad ? 1 : 0);
