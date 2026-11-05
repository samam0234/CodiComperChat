// 데모 계정으로 실제 앱을 돌며 스크린샷과 녹화를 남긴다. 대답과 그림은 실제 모델이 만든다
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { OUT, TMP, URLS, databaseUrl } from "./env.mjs";

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
const SLOW = 900_000;
const VIEW = { width: 1280, height: 800 };
const stamp = Date.now() % 1_000_000;
const PASSWORD = "readme-demo-1234";

async function api(path, { token, json, method } = {}) {
  const res = await fetch(`${URLS.api}${path}`, {
    method: method ?? (json ? "POST" : "GET"),
    headers: { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: json ? JSON.stringify(json) : undefined,
    signal: AbortSignal.timeout(SLOW),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(body)?.slice(0, 200)}`);
  return body;
}

const sql = new pg.Client({ connectionString: databaseUrl().toString() });
await sql.connect();
async function account(name, role = "USER") {
  const email = `demo${stamp}${role === "USER" ? "u" : "a"}@example.com`;
  const { token } = await api("/auth/signup", { json: { email, password: PASSWORD, displayName: name } });
  await sql.query(`update users set "emailVerifiedAt" = now(), role = $2 where email = $1`, [email, role]);
  return { email, token };
}

const log = (text) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${text}`);
const shot = async (page, name, options = {}) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: "jpeg", quality: 82, ...options });
  log(`찍음 ${name}`);
};
const seyeon = (await sql.query(`select id from characters where name = '이세연'`)).rows[0].id;
const CHAT = `/characters/${seyeon}/chat`;
const OPS = `${CHAT}/ops`;

const user = await account("데모");
const admin = await account("운영자", "ADMIN");
await api("/me/attendance", { token: user.token, method: "POST" });

const browser = await chromium.launch({ channel: "chrome" });
const cookieFor = (token) => [
  { name: "session", value: token, url: URLS.web, httpOnly: true },
  { name: "console_session", value: token, url: URLS.console, httpOnly: true },
];
async function open(token = user.token, viewport = VIEW, extra = {}) {
  const context = await browser.newContext({ viewport, locale: "ko-KR", ...extra });
  await context.addCookies(cookieFor(token));
  context.setDefaultTimeout(SLOW);
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120_000);
  return { context, page };
}
const go = async (page, path) => {
  await page.goto(path.startsWith("http") ? path : URLS.web + path);
  await page.waitForLoadState("networkidle");
};
const say = async (page, text) => {
  await page.getByPlaceholder(/에게 말 걸기/).fill(text);
  await page.getByRole("button", { name: "보내기" }).click();
  await page.getByText(/가 답하는 중/).waitFor({ state: "hidden" });
  await page.waitForTimeout(600);
};

// ── 첫 화면과 대화 ──
const { page } = await open();
await go(page, "/");
// 첫 화면의 밝기는 한국 시각에 따라 다르다 (오전 7시~오후 10시가 밝음)
const startsDark = (await page.locator("html").getAttribute("data-theme")) === "dark";
await shot(page, startsDark ? "home-dark" : "home-light");
await page.getByRole("banner").getByRole("button", { name: /모드로 바꾸기/ }).click();
await page.waitForTimeout(500);
await shot(page, startsDark ? "home-light" : "home-dark");
await page.getByRole("banner").getByRole("button", { name: /모드로 바꾸기/ }).click();
await go(page, `/characters/${seyeon}`);
await shot(page, "character");
await go(page, CHAT);
await shot(page, "chat-recommend");
await page.getByRole("region", { name: "추천 프로필" }).getByRole("button", { name: "이 프로필로 시작" }).click();
await page.locator("#persona-select").waitFor();
await page.waitForTimeout(500);
log("대화 시작");
await say(page, "세연 씨, 오늘 오전 일정부터 정리해 주세요.");
await say(page, "어젯밤에 좀 늦게 잤는데, 티 나요?");
await say(page, "3분기 해외 법인 실적은 어땠어요?");
await shot(page, "chat");

// 대화 3번 뒤 이야기 정리가 끝나기를 기다린다
for (let i = 0; i < 60; i += 1) {
  const story = await api(`${CHAT}/story`, { token: user.token });
  if (story.brief || story.summary || (story.relation?.value ?? 0) > 0 || (story.hooks ?? story.openHooks ?? []).length) break;
  await page.waitForTimeout(5000);
}
await go(page, CHAT);
const panel = page.getByRole("region", { name: "지난 이야기" });
await panel.getByRole("button", { name: /지난 이야기/ }).click();
await panel.scrollIntoViewIfNeeded();
await shot(page, "story");
await go(page, `${CHAT}/memories`);
await shot(page, "memories");

// ── 오퍼레이션 ──
log("심리 탐구·일기");
await go(page, CHAT);
await page.getByRole("button", { name: "오퍼레이션" }).click();
await shot(page, "ops-menu");
await go(page, `${CHAT}/mind`);
await page.getByRole("button", { name: /속마음 엿보기/ }).click();
await page.getByRole("list", { name: "엿본 속마음" }).getByRole("listitem").first().waitFor();
await shot(page, "ops-mind");
await api(`${OPS}/diary`, { token: user.token, method: "POST" });
await go(page, `${CHAT}/diary`);
await shot(page, "ops-diary");
await api(`${OPS}/board/refresh`, { token: user.token, method: "POST" });
await go(page, `${CHAT}/community`);
await shot(page, "ops-community");

// ── 그림 (실제 그림 엔진) ──
log("코디포토넷 한 장");
const photo = await api(`${OPS}/photonet`, { token: user.token, json: { prompt: "오전의 회장실, 서류를 건네는 비서", style: "애니메이션", ratio: "가로" } });
await go(page, CHAT);
await page.getByRole("button", { name: "코디포토넷" }).click();
const dialog = page.getByRole("dialog", { name: "코디포토넷" });
await dialog.getByRole("region", { name: "만든 그림" }).getByRole("img").first().waitFor();
await page.waitForTimeout(1500);
await shot(page, "photonet");
await page.keyboard.press("Escape");

log("웹툰 3컷");
const made = await api(`${OPS}/webtoon`, { token: user.token, json: { prompt: "회의 전 커피를 건네며 건강을 걱정하는 장면", panels: 3 } });
for (const index of [0, 1, 2]) {
  log(`컷 ${index + 1}`);
  await api(`${OPS}/webtoon/${made.webtoon.id}/panels/${index}`, { token: user.token, method: "POST" });
}
await go(page, `${CHAT}/webtoon`);
await page.getByRole("list", { name: "만든 웹툰" }).getByRole("img").first().waitFor();
await page.waitForTimeout(1500);
const article = page.getByRole("list", { name: "만든 웹툰" }).getByRole("article").first();
await article.screenshot({ path: join(OUT, "webtoon.jpg"), type: "jpeg", quality: 82 });
log("찍음 webtoon");

// ── 공방 ──
log("공방");
const draft = await api("/studio/characters", { token: user.token, method: "POST" });
await api(`/studio/characters/${draft.id}`, {
  token: user.token,
  method: "PATCH",
  json: {
    card: {
      identity: { name: "한지우", oneLiner: "골목 끝 작은 카페를 혼자 꾸리는 바리스타", role: "guide", occupation: "바리스타", apparentAge: "30", tags: ["카페", "일상"] },
      appearance: { description: "짧은 갈색 머리, 앞치마", keywords: ["차분함"] },
      personality: { warmth: 70, directness: 30, impulse: 20, protectiveness: 60, honorific: "jondae", addressing: "손님이라 부른다", habits: ["말끝을 흐린다"], forbidden: ["인터넷 말투"], summary: "말수가 적지만 다정하다" },
      campaign: { scene: "비 오는 오후의 카페", knows: "단골의 취향", unknown: "손님의 사정", goal: "가게를 오래 지키는 것", stance: "손님을 먼저 살핀다", conflictSeed: "가게 건물의 재개발 소문" },
      boundary: { secret: "", unlockCondition: "", neverDo: ["AI라고 말하기"], breakers: "" },
      greeting: { firstMessage: '*컵을 닦다 고개를 든다* "어서 오세요. 비가 많이 오죠?"', alternates: [], examples: [] },
      lore: { world: "", person: "", taboo: "", extra: [] },
    },
  },
});
await go(page, `/studio/${draft.id}`);
await shot(page, "studio");
await page.getByRole("button", { name: /외형/ }).first().click();
await page.getByRole("button", { name: "AI로 직접 만들기 · 25 코레딧" }).click();
const ai = page.getByRole("group", { name: "AI로 초상 만들기" });
await ai.getByLabel("머리색").selectOption("brown");
await ai.getByLabel("머리 모양").selectOption("short");
await ai.getByLabel("옷차림").selectOption("casual");
await ai.getByLabel("표정").selectOption("calm");
await ai.getByRole("button", { name: "만들기 · 25 코레딧" }).click();
await ai.getByRole("list", { name: "만든 후보" }).getByRole("img").first().waitFor();
await ai.getByRole("list", { name: "만든 후보" }).screenshot({ path: join(OUT, "studio-portrait.jpg"), type: "jpeg", quality: 88 });
log("찍음 studio-portrait");

// ── 요금·설정 ──
await go(page, "/pricing");
await shot(page, "pricing");
await go(page, "/settings");
await page.locator("#age-settings").scrollIntoViewIfNeeded();
await shot(page, "settings");

// ── 운영 콘솔 ──
log("콘솔");
await api(`/characters/${seyeon}/content-reports`, { token: user.token, json: { target: "PHOTONET", targetId: photo.image.id, reason: "OTHER", detail: "README 데모용 신고" } });
const adminView = await open(admin.token);
await go(adminView.page, `${URLS.console}/`);
await shot(adminView.page, "console-dashboard");
await go(adminView.page, `${URLS.console}/content`);
await shot(adminView.page, "console-content");
await go(adminView.page, `${URLS.console}/characters`);
await shot(adminView.page, "console-characters");
await adminView.context.close();

// ── 모바일 ──
const phone = await open(user.token, { width: 390, height: 844 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await go(phone.page, CHAT);
await shot(phone.page, "mobile-chat");
await phone.context.close();
await page.context().close();

await browser.close();
await sql.end();
log("끝");
