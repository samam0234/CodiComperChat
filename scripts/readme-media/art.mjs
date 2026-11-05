// 배너·구조도·제목 카드를 HTML에서 PNG로 만든다. 색은 apps/web/app/globals.css의 토큰과 같다
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { OUT, TMP } from "./env.mjs";

const FONT = `"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans CJK KR", sans-serif`;
const GRADIENT = "linear-gradient(135deg, #6d4dff 0%, #b45cff 52%, #ff5fa2 100%)";
const BASE = `*{box-sizing:border-box;margin:0}body{font-family:${FONT};color:#1d1636;background:#fff}`;

export async function render(browser, html, path, { width = 1280, height = 720, transparent = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${BASE}</style>${html}`);
  await page.screenshot({ path, omitBackground: transparent });
  await page.close();
}

const box = (title, lines, tone = "#6d4dff") => `
  <div style="border:2px solid ${tone};border-radius:16px;padding:14px 18px;background:#fff">
    <div style="font-weight:700;font-size:20px;color:${tone}">${title}</div>
    <div style="font-size:15px;line-height:1.55;color:#4a4266;margin-top:6px">${lines.join("<br>")}</div>
  </div>`;
const arrow = (label = "") => `
  <div style="display:flex;flex-direction:column;align-items:center;font-size:13px;color:#7a7296;line-height:1.3">
    <div>${label}</div><div style="font-size:24px;color:#b45cff">↓</div>
  </div>`;

const banner = `
<div style="width:1280px;height:380px;background:#0d0a1a;position:relative;overflow:hidden;color:#fff;font-family:${FONT}">
  <div style="position:absolute;inset:-40%;background:radial-gradient(closest-side at 22% 30%,rgba(141,107,255,.55),transparent 62%),radial-gradient(closest-side at 78% 38%,rgba(255,95,162,.42),transparent 60%),radial-gradient(closest-side at 55% 88%,rgba(90,180,255,.28),transparent 60%)"></div>
  <div style="position:absolute;left:72px;top:62px;right:72px">
    <div style="font-size:21px;letter-spacing:.14em;color:#d9cfff">CodiComperChat</div>
    <div style="font-size:66px;font-weight:800;margin-top:12px;background:${GRADIENT};-webkit-background-clip:text;color:transparent;filter:brightness(1.25)">코디컴퍼챗</div>
    <div style="font-size:30px;font-weight:600;margin-top:18px">어제의 이야기를 기억하는 캐릭터와 이어 가는 캠페인</div>
    <div style="font-size:19px;margin-top:18px;color:#cfc7ea">기억 · 관계 · 복선 · 비밀 퀘스트 · 장면 그림 · 웹툰 · 캐릭터 공방</div>
  </div>
</div>`;

const architecture = `
<div style="width:1280px;height:700px;padding:36px 44px;background:#fbfaff">
  <div style="font-size:30px;font-weight:800">시스템 구조</div>
  <div style="font-size:16px;color:#6b6388;margin-top:4px">호출 방향은 한 방향이다. 브라우저와 웹은 FastAPI를 직접 부르지 않는다.</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px">
    ${box("apps/web · Next.js 16", ["이용자 사이트, 화면 31개", "요청마다 nonce CSP, 서버 컴포넌트·서버 액션만 Nest를 부른다"])}
    ${box("console · Next.js 16", ["운영자 전용, 따로 로그인", "신고·초상 검수·그림 신고·계정 관리"])}
  </div>
  ${arrow("Authorization: Bearer (httpOnly 쿠키의 토큰을 서버가 붙인다)")}
  ${box("apps/api · Nest.js 12 + Prisma 7 — 신뢰 경계", ["인증·권한·소유 확인·요청 한도·코레딧·모델 조건·컨텍스트 조립·이야기 상태·퀘스트 판정 반영", "AI 호출 대기열: 동시 수 제한, 기다리는 답 우선"], "#d6336f")}
  <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:18px;margin-top:8px">
    <div>${arrow("Prisma")}${box("PostgreSQL 16", ["테이블 28개, 마이그레이션 33개", "Redis·벡터 DB 없음"], "#1c8a5a")}</div>
    <div>${arrow("내부망, AI_SERVICE_TOKEN")}${box("services/ai · FastAPI (Python 3.12)", ["연기·요약·기억·판정·검수·장면 설계", "DB를 보지 않고 Nest가 조립한 맥락만 쓴다"], "#2b6fd6")}</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px">
    ${box("Ollama", ["gemma4:e4b · gemma4:12b", "대화·판정·그림 검수"], "#2b6fd6")}
    ${box("그림 엔진 (diffusers)", ["Animagine XL 4.0 · SD 1.5", "같은 프로세스, NVIDIA GPU"], "#2b6fd6")}
    ${box("프리미엄 공급자", ["Claude · Grok 연동 코드", "키와 월 상한이 없으면 닫힘"], "#8a84a3")}
  </div>
</div>`;

const turn = `
<div style="width:1280px;height:540px;padding:36px 44px;background:#fbfaff">
  <div style="font-size:30px;font-weight:800">대화 한 턴은 이렇게 처리된다</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:24px">
    ${box("1. 확인", ["로그인·요청 한도", "볼 수 있는 캐릭터", "고정된 내 프로필", "모델 조건·코레딧"], "#d6336f")}
    ${box("2. 맥락 조립", ["카드 핵심 (비밀 제외)", "지식 조각 (2-gram BM25)", "친밀도·복선·지난 요약", "최근 30턴·장기 기억"], "#d6336f")}
    ${box("3. 답 만들기", ["대기열 → FastAPI /infer", "말투·역할 규칙", "장면이 바뀌면 @: 나레이션"], "#2b6fd6")}
    ${box("4. 개인사 검사", ["설정에 없는 개인사를 물은 턴만", "/ground-check", "지어냈으면 다시 쓴다(최대 2번)"], "#2b6fd6")}
  </div>
  <div style="text-align:center;font-size:24px;color:#b45cff;margin:10px 0">↓</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    ${box("5. 저장하고 돌려주기", ["유저 말과 답을 함께 저장한다", "답을 못 만들면 저장하지 않고 코레딧을 돌려준다"], "#1c8a5a")}
    ${box("6. 뒤에서 정리 (메시지 6개마다)", ["/remember → 장기 기억", "/summarize → 요약·친밀도·복선", "비밀 퀘스트: 후보 판정 + 인용 근거를 실제 대사와 대조"], "#6d4dff")}
  </div>
  <div style="margin-top:22px;padding:14px 18px;border-radius:14px;background:#f1edff;font-size:17px">
    <b>비밀과 달성 조건은 캐릭터 모델에게 보내지 않는다.</b> 안전 규칙은 모델 출력에 기대지 않고 코드로 강제한다.
  </div>
</div>`;

const card = (title, sub, foot = "") => `
<div style="width:1280px;height:720px;background:#0d0a1a;position:relative;overflow:hidden;color:#fff;font-family:${FONT}">
  <div style="position:absolute;inset:-40%;background:radial-gradient(closest-side at 25% 35%,rgba(141,107,255,.5),transparent 60%),radial-gradient(closest-side at 75% 60%,rgba(255,95,162,.36),transparent 60%)"></div>
  <div style="position:absolute;left:90px;right:90px;top:250px">
    <div style="font-size:64px;font-weight:800">${title}</div>
    <div style="font-size:30px;margin-top:22px;color:#e4dcff;line-height:1.45">${sub}</div>
    <div style="font-size:20px;margin-top:30px;color:#bdb3e0">${foot}</div>
  </div>
</div>`;

export const CAPTIONS = {
  home: "홈: 이어서 대화하기와 캐릭터 카드",
  character: "캐릭터마다 성격·말투·비밀이 카드로 정해져 있다",
  chat: "실제 gemma4:e4b가 답한다. 답은 다 만들어진 뒤 한 번에 보인다",
  ops: "오퍼레이션: 속마음을 엿보고, 일기·문자·게시판으로 이야기를 넓힌다",
  photonet: "코디포토넷: 대화 장면을 그림으로. 그린 시간은 영상에서 뺐다",
  webtoon: "웹툰: 콘티를 짜고 컷을 하나씩 그린다",
  studio: "캐릭터 공방: 8단계 카드, 3턴 테스트를 통과해야 발행된다",
  pricing: "정식 서비스 전까지는 눌러서 프로로 바꾼다. 실제 결제는 보류 중이다",
};

export const caption = (text) => `
<div style="width:1280px;height:720px;position:relative;font-family:${FONT}">
  <div style="position:absolute;left:50%;transform:translateX(-50%);bottom:30px;max-width:1120px;padding:12px 24px;border-radius:14px;background:rgba(13,10,26,.86);color:#fff;font-size:26px;font-weight:600;white-space:nowrap">${text}</div>
</div>`;

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  await render(browser, banner, join(OUT, "banner.png"), { height: 380 });
  await render(browser, architecture, join(OUT, "architecture.png"), { height: 700 });
  await render(browser, turn, join(OUT, "chat-turn.png"), { height: 540 });
  await render(browser, card("코디컴퍼챗", "어제의 이야기를 기억하는 캐릭터와 이어 가는 캠페인", "실제로 띄운 앱의 화면입니다"), join(TMP, "card-intro.png"));
  await render(browser, card("끝까지 기억하는 동행", "기억 · 관계 · 복선 · 비밀 퀘스트 · 장면 그림 · 웹툰 · 공방", "개발 단계이며 아직 공개 서비스가 아닙니다"), join(TMP, "card-outro.png"));
  await browser.close();
}
