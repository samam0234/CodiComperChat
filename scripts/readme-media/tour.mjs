// 소개 영상용 녹화. capture.mjs가 만든 데모 계정과 데이터를 그대로 쓴다
// Playwright의 녹화 도구가 필요하다: npx playwright install ffmpeg
import { chromium } from "@playwright/test";
import { renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { TMP, URLS, databaseUrl } from "./env.mjs";

const SLOW = 900_000;
const sql = new pg.Client({ connectionString: databaseUrl().toString() });
await sql.connect();
const { email, id: userId } = (await sql.query(`select email, id from users where email like 'demo%u@example.com' order by "createdAt" desc limit 1`)).rows[0];
const seyeon = (await sql.query(`select id from characters where name = '이세연'`)).rows[0].id;
const draft = (await sql.query(`select id from character_drafts where "ownerId" = $1 order by "createdAt" desc limit 1`, [userId])).rows[0];
const login = await fetch(`${URLS.api}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "readme-demo-1234" }) });
const user = await login.json();
const CHAT = `/characters/${seyeon}/chat`;
const browser = await chromium.launch({ channel: "chrome" });
const cookieFor = (token) => [{ name: "session", value: token, url: URLS.web, httpOnly: true }];
const go = async (page, path) => {
  await page.goto(URLS.web + path);
  await page.waitForLoadState("networkidle");
};

const steps = [];
const rec = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: "ko-KR", recordVideo: { dir: TMP, size: { width: 1280, height: 720 } } });
await rec.addCookies(cookieFor(user.token));
rec.setDefaultTimeout(SLOW);
const video = await rec.newPage();
const start = Date.now();
const mark = (id) => steps.push({ id, at: (Date.now() - start) / 1000 });
const smooth = async (px, ms = 1500) => {
  await video.mouse.move(640, 400);
  const n = Math.ceil(ms / 50);
  for (let i = 0; i < n; i += 1) {
    await video.mouse.wheel(0, px / n);
    await video.waitForTimeout(50);
  }
};
mark("home");
await go(video, "/");
await video.waitForTimeout(2500);
await smooth(450);
await video.waitForTimeout(1200);
mark("character");
await go(video, `/characters/${seyeon}`);
await video.waitForTimeout(2800);
mark("chat");
await go(video, CHAT);
await video.waitForTimeout(1200);
await video.getByPlaceholder(/에게 말 걸기/).pressSequentially("회의 전에 커피 한 잔 부탁해요.", { delay: 45 });
await video.waitForTimeout(500);
await video.getByRole("button", { name: "보내기" }).click();
await video.getByText(/가 답하는 중/).waitFor({ state: "hidden" });
await video.waitForTimeout(3500);
mark("ops");
await video.getByRole("button", { name: "오퍼레이션" }).click();
await video.waitForTimeout(1800);
await go(video, `${CHAT}/mind`);
await video.waitForTimeout(3000);
mark("photonet");
await go(video, CHAT);
await video.getByRole("button", { name: "코디포토넷" }).click();
await video.getByRole("dialog", { name: "코디포토넷" }).getByRole("region", { name: "만든 그림" }).scrollIntoViewIfNeeded();
await video.waitForTimeout(3000);
await video.keyboard.press("Escape");
mark("webtoon");
await go(video, `${CHAT}/webtoon`);
await video.getByRole("list", { name: "만든 웹툰" }).scrollIntoViewIfNeeded();
await video.waitForTimeout(1500);
await smooth(700, 2500);
await video.waitForTimeout(1200);
mark("studio");
await go(video, `/studio/${draft.id}`);
await video.waitForTimeout(2500);
await smooth(400);
await video.waitForTimeout(800);
mark("pricing");
await go(video, "/pricing");
await video.waitForTimeout(2800);
mark("end");
const handle = video.video();
await rec.close();
renameSync(await handle.path(), join(TMP, "tour.webm"));
writeFileSync(join(TMP, "tour.json"), JSON.stringify(steps, null, 2));
await browser.close();
await sql.end();
console.log("끝", JSON.stringify(steps));
