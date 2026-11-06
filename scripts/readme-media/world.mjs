// 월드코퍼챗 화면을 찍는다 (2026-11-06). servers.mjs를 켜 둔 채로 돌린다.
// 진행자 답과 파트 판정은 실제 모델(gemma4:e4b)이 한다. 지도·장면 그림·인물 그림은 art.mjs의 HTML 예시 그림이다(그림 엔진으로 그리지 않았다)
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { DEMO_ART } from "./art.mjs";
import { OUT, TMP, URLS, databaseUrl } from "./env.mjs";

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
const SLOW = 900_000;
const VIEW = { width: 1280, height: 860 };
const stamp = Date.now() % 1_000_000;
const log = (text) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${text}`);

async function api(path, { token, json, method, raw } = {}) {
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  let body;
  if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (raw) {
    headers["Content-Type"] = raw.type;
    body = raw.body;
  }
  const res = await fetch(`${URLS.api}${path}`, { method: method ?? (body ? "POST" : "GET"), headers, body, signal: AbortSignal.timeout(SLOW) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(data)?.slice(0, 200)}`);
  return data;
}

const sql = new pg.Client({ connectionString: databaseUrl().toString() });
await sql.connect();
async function account(name, role = "USER") {
  const email = `world${stamp}${role === "USER" ? "u" : "a"}@example.com`;
  const { token } = await api("/auth/signup", { json: { email, password: "readme-demo-1234", displayName: name } });
  await sql.query(`update users set "emailVerifiedAt" = now(), role = $2 where email = $1`, [email, role]);
  return { email, token };
}

const user = await account("세레나 작가");
const admin = await account("운영자", "ADMIN");
const persona = await api("/me/personas", { token: user.token, json: { name: "이안", description: "항구에 막 도착한 젊은 기자. 호기심이 많고 겁이 없다." } });
await api("/admin/world-settings", { token: admin.token, method: "PUT", json: { eventChance: 0, eventMinTurns: 6, dailyRewardCap: 3 } });

// ── 데모 그림 (HTML) ──
const browser = await chromium.launch({ channel: "chrome" });
async function art(html, name, { width = 1280, height = 720, png = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}body{background:transparent;font-family:"Malgun Gothic",sans-serif}</style>${html}`);
  const path = join(TMP, `${name}.${png ? "png" : "jpg"}`);
  await page.screenshot(png ? { path, omitBackground: true } : { path, type: "jpeg", quality: 80 });
  await page.close();
  return { type: png ? "image/png" : "image/jpeg", body: readFileSync(path) };
}
const map = await art(DEMO_ART.map, "demo-map", { height: 800 });
const images = [
  ["밤의 부두", "", await art(DEMO_ART.dock, "demo-dock")],
  ["등대 불빛", "", await art(DEMO_ART.lighthouse, "demo-lighthouse")],
  ["아침 시장", "", await art(DEMO_ART.market, "demo-market")],
  ["서린", "한서린", await art(DEMO_ART.seorin, "demo-seorin", { width: 600, height: 900, png: true })],
  ["도윤", "도윤", await art(DEMO_ART.doyun, "demo-doyun", { width: 600, height: 900, png: true })],
];
log("데모 그림 준비");

const DOC = {
  title: "세레나 항구의 밤",
  oneLiner: "불 끈 배 한 척이 들어온 밤, 항구의 비밀이 하나씩 드러난다",
  setting:
    "증기선과 범선이 함께 오가는 항구 도시 세레나. 밤이면 언덕 위 등대 불빛이 바다를 가르고, 항구 관리소가 드나드는 모든 배를 장부에 적는다. 마법은 없고, 소문과 밀수가 많다. 시장은 새벽부터 열리고, 선술집은 자정을 넘겨도 문을 닫지 않는다.",
  rules: "총은 귀하고 함부로 쓰지 않는다. 관리소 장부에 없는 배는 불법이다. 등대지기는 밤에 등대를 비우지 않는다.",
  opening: '@: 자정 무렵, 불을 끈 배 한 척이 소리 없이 부두에 닿는다.\n한서린: *장부를 덮으며* "저 배는 기록에 없어요. 기자님, 오늘 밤은 여기서 기다리시는 게 좋겠어요."',
  places: [
    { name: "관리소", x: 24, y: 52, note: "배의 출입을 장부에 적는 곳" },
    { name: "부두", x: 46, y: 58, note: "배가 닿는 긴 나무 부두" },
    { name: "등대", x: 85, y: 30, note: "언덕 위, 밤새 불이 켜져 있다" },
    { name: "시장", x: 60, y: 80, note: "새벽부터 열린다" },
    { name: "선술집", x: 14, y: 76, note: "자정을 넘겨도 문을 닫지 않는다" },
  ],
  cast: [
    { name: "한서린", summary: "항구 관리소 직원, 30대 여성. 꼼꼼하고 규칙을 중시하지만 사람을 잘 챙긴다", speech: "존댓말, 단정하고 짧게", startPlace: "관리소", homePlace: "관리소" },
    { name: "도윤", summary: "등대지기, 40대 남성. 무뚝뚝하지만 정이 많고 바다의 모든 배를 기억한다", speech: "반말, 짧게 끊어 말함", startPlace: "등대", homePlace: "등대" },
    { name: "마르코", summary: "외지에서 온 상인. 수다스럽고 능청스러우며 어딘가 수상하다", speech: "능청스러운 존댓말", startPlace: "시장", homePlace: "선술집" },
  ],
  parts: [
    { title: "낯선 배", goal: "주인공이 불 끈 배에 대해 구체적인 단서(배 이름, 화물, 선원 중 하나)를 얻는다", opening: "" },
    { title: "등대의 신호", goal: "주인공이 도윤에게서 그 배가 전에도 온 적이 있다는 이야기를 듣는다", opening: "새벽이 오기 전, 등대 불빛이 세 번 깜빡인다." },
    { title: "시장의 거래", goal: "주인공이 마르코가 그 배와 거래했다는 사실을 밝혀낸다", opening: "아침 시장이 열리고, 마르코의 좌판에 낯선 상자가 놓여 있다." },
  ],
};

// 첫 장면은 대화 방식의 모양으로 쓴다 (진행자가 앞 글의 모양을 따라 쓴다)
const OPENING = {
  CHAT: DOC.opening,
  VISUAL_NOVEL: DOC.opening,
  NOVEL: "자정 무렵, 불을 끈 배 한 척이 소리 없이 부두에 닿았다. 관리소 창가에서 장부를 넘기던 한서린은 손을 멈추고 낮게 말했다. \"저 배는 기록에 없어요. 기자님, 오늘 밤은 여기서 기다리시는 게 좋겠어요.\"",
  MESSENGER: "한서린: 방금 부두에 기록 없는 배 들어왔어요\n도윤: 불 끄고 들어오더라. 등대에서 다 봤다\n마르코: 오호, 이 시간에요? 재밌네요",
};

async function makeWorld(mode, title) {
  const { id } = await api("/worlds", { token: user.token, method: "POST" });
  await api(`/worlds/${id}`, { token: user.token, method: "PUT", json: { world: { ...DOC, title, mode, opening: OPENING[mode] } } });
  await api(`/worlds/${id}/map`, { token: user.token, method: "PUT", raw: map });
  for (const [label, character, image] of images) {
    await api(`/worlds/${id}/images?label=${encodeURIComponent(label)}&character=${encodeURIComponent(character)}`, { token: user.token, method: "PUT", raw: image });
  }
  await api(`/worlds/${id}/publish`, { token: user.token, json: { visibility: "PUBLIC" } });
  await api(`/worlds/${id}/play`, { token: user.token, json: { personaId: persona.id } });
  log(`세계관 ${mode} ${id}`);
  return id;
}
const turn = async (id, text) => {
  const t0 = Date.now();
  const state = await api(`/worlds/${id}/play/turn`, { token: user.token, json: { text } });
  log(`  턴 ${((Date.now() - t0) / 1000).toFixed(1)}초: ${text}`);
  return state;
};

const worlds = {
  CHAT: await makeWorld("CHAT", DOC.title),
  VISUAL_NOVEL: await makeWorld("VISUAL_NOVEL", "세레나 항구의 밤 · 비주얼노벨"),
  NOVEL: await makeWorld("NOVEL", "세레나 항구의 밤 · 소설"),
  MESSENGER: await makeWorld("MESSENGER", "세레나 항구 단톡방"),
};
const LINES = {
  CHAT: ["(부두로 내려가 그 배를 살펴본다) 누가 타고 있었죠?", "서린 씨, 장부에 없는 배가 들어오면 보통 어떻게 해요?"],
  VISUAL_NOVEL: ["(등대로 올라가 문을 두드린다) 도윤 씨, 오늘 밤 들어온 배 보셨어요?", "그 배, 전에도 본 적 있어요?"],
  NOVEL: ["*선술집 문을 밀고 들어가 마르코 옆에 앉는다* 오늘 밤 부두에 들어온 배, 아시죠?", "그 상자 안에 뭐가 들었는지 말해 줄 수 있어요?"],
  MESSENGER: ["다들 오늘 밤 부두 봤어요? 불 끈 배 들어온 거", "도윤 씨 등대에서는 뭐가 보였어요?"],
};
for (const [mode, id] of Object.entries(worlds)) for (const line of LINES[mode]) await turn(id, line);

// ── 화면 ──
const shot = async (page, name, options = {}) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: "jpeg", quality: 82, ...options });
  log(`찍음 ${name}`);
};
async function open(viewport = VIEW) {
  const context = await browser.newContext({ viewport, locale: "ko-KR", colorScheme: "light" });
  await context.addCookies([
    { name: "session", value: user.token, url: URLS.web, httpOnly: true },
    { name: "console_session", value: admin.token, url: URLS.console, httpOnly: true },
  ]);
  context.setDefaultTimeout(SLOW);
  return context.newPage();
}
const go = async (page, path) => {
  await page.goto(path.startsWith("http") ? path : URLS.web + path);
  await page.waitForLoadState("networkidle");
};
const page = await open();

await go(page, "/worlds");
await shot(page, "world-list");
await go(page, `/worlds/${worlds.CHAT}`);
await shot(page, "world-detail", { fullPage: true });

await go(page, `/worlds/${worlds.CHAT}/edit`);
await page.getByRole("tab", { name: "등장인물" }).click();
await shot(page, "world-editor-cast");
await page.getByRole("tab", { name: "장소·코퍼맵" }).click();
await shot(page, "world-editor-map");
await page.getByRole("tab", { name: "파트" }).click();
await shot(page, "world-editor-parts");

for (const [mode, id] of Object.entries(worlds)) {
  await go(page, `/worlds/${id}/play`);
  await shot(page, `world-play-${mode.toLowerCase().replace("_", "-")}`);
}
// 코퍼맵 열기
await go(page, `/worlds/${worlds.CHAT}/play`);
await page.getByTestId("map-toggle").click();
await shot(page, "world-play-map");

// 이벤트: 확률을 1로 올려 한 번 띄운다
await api("/admin/world-settings", { token: admin.token, method: "PUT", json: { eventChance: 1, eventMinTurns: 1 } });
await page.getByTestId("map-toggle").click();
await page.getByTestId("world-input").fill("(시장 쪽에서 북소리가 들린다) 무슨 소리죠?");
await page.getByTestId("world-send").click();
const dialog = page.getByTestId("world-event");
await dialog.waitFor();
await shot(page, "world-event");
if (await dialog.getByTestId("event-choice").count()) await dialog.getByTestId("event-choice").nth(1).click();
else if (await dialog.getByTestId("event-roll").count()) await dialog.getByTestId("event-roll").click();
else if (await dialog.getByTestId("event-throw").count()) await dialog.getByTestId("event-throw").click();
else await dialog.getByRole("button", { name: "포기" }).click();
await dialog.getByTestId("event-result").waitFor();
await shot(page, "world-event-result");
await api("/admin/world-settings", { token: admin.token, method: "PUT", json: { eventChance: 0.35, eventMinTurns: 6 } });

// 모바일 플레이 (메신저형)
const phone = await open({ width: 390, height: 844 });
await go(phone, `/worlds/${worlds.MESSENGER}/play`);
await shot(phone, "world-mobile");

// 운영 콘솔
await go(page, `${URLS.console}/worlds`);
await shot(page, "console-worlds");
await go(page, `${URLS.console}/worlds/${worlds.CHAT}`);
await shot(page, "console-world-detail");
await go(page, `${URLS.console}/worlds/events`);
await shot(page, "console-world-events");
await go(page, `${URLS.console}/worlds/settings`);
await shot(page, "console-world-settings");

await browser.close();
await sql.end();
log("끝");
