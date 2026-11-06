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
  ${box("apps/api · Nest.js 12 + Prisma 7 — 신뢰 경계", ["인증·권한·소유 확인·요청 한도·코레딧·모델 조건·컨텍스트 조립·이야기 상태·퀘스트 판정 반영·월드코퍼챗(파트·이벤트 판정)", "AI 호출 대기열: 동시 수 제한, 기다리는 답 우선"], "#d6336f")}
  <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:18px;margin-top:8px">
    <div>${arrow("Prisma")}${box("PostgreSQL 16", ["테이블 28개, 마이그레이션 33개", "Redis·벡터 DB 없음"], "#1c8a5a")}</div>
    <div>${arrow("내부망, AI_SERVICE_TOKEN")}${box("services/ai · FastAPI (Python 3.12)", ["연기·요약·기억·판정·검수·장면 설계·월드 진행자", "DB를 보지 않고 Nest가 조립한 맥락만 쓴다"], "#2b6fd6")}</div>
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

export const caption = (text) => `<style>body{background:transparent}</style>
<div style="width:1280px;height:720px;position:relative;font-family:${FONT}">
  <div style="position:absolute;left:50%;transform:translateX(-50%);bottom:30px;max-width:1120px;padding:12px 24px;border-radius:14px;background:rgba(13,10,26,.86);color:#fff;font-size:26px;font-weight:600;white-space:nowrap">${text}</div>
</div>`;

const chip = (text, tone) => `<span style="display:inline-block;margin:4px 6px 0 0;padding:6px 12px;border-radius:999px;background:${tone}14;border:1.5px solid ${tone};color:${tone};font-size:16px;font-weight:700">${text}</span>`;
const row = (title, sub, tone, chips) => `
  <div style="display:grid;grid-template-columns:230px 1fr;gap:18px;align-items:center;border:2px solid ${tone}33;border-radius:16px;padding:12px 20px;background:#fff">
    <div><div style="font-size:21px;font-weight:800;color:${tone}">${title}</div><div style="font-size:14px;color:#7a7296;margin-top:3px">${sub}</div></div>
    <div>${chips.map((c) => chip(c, tone)).join("")}</div>
  </div>`;

const stack = `
<div style="width:1280px;height:640px;padding:34px 44px;background:#fbfaff">
  <div style="font-size:30px;font-weight:800">기술 스택</div>
  <div style="font-size:16px;color:#6b6388;margin-top:4px">버전은 package.json과 requirements.txt에 고정된 값이다. 자체 모델을 학습하지 않고 공개 모델을 쓴다.</div>
  <div style="display:grid;gap:12px;margin-top:20px">
    ${row("화면", "apps/web · console", "#6d4dff", ["Next.js 16.4", "React 19.2", "TypeScript 6", "CSS Modules", "nonce CSP"])}
    ${row("도메인 API", "apps/api · 신뢰 경계", "#d6336f", ["Nest.js 12 (ESM)", "Prisma 7.10", "PostgreSQL 16", "Vitest 4", "Redis 없음"])}
    ${row("AI 서비스", "services/ai · 내부망", "#2b6fd6", ["FastAPI 0.141", "Python 3.12", "Ollama", "gemma4 e4b / 12b", "diffusers 0.42", "PyTorch 2.10 + CUDA 12.8", "Animagine XL 4.0 · SD 1.5"])}
    ${row("시험", "e2e · evals · bench", "#1c8a5a", ["Playwright 1.64", "unittest", "가짜 LLM e2e", "실제 모델 평가", "부하 측정"])}
    ${row("배포·운영", "deploy · scripts", "#8a6d00", ["Docker Compose", "Caddy", "NVIDIA GPU 한 대", "GitHub Actions", "로컬 CI 12단계"])}
  </div>
</div>`;

// 월드코퍼챗 (2026-11-06): 처리 흐름도와 기능 지도
const worldFlow = `
<div style="width:1280px;height:580px;padding:34px 44px;background:#fbfaff">
  <div style="font-size:30px;font-weight:800">월드코퍼챗 한 턴은 이렇게 처리된다</div>
  <div style="font-size:16px;color:#6b6388;margin-top:4px">진행자(GM) 모델이 여러 인물을 연기하고, 판단이 필요한 일(그림·장소·파트·이벤트 결과)은 코드가 확인한다</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:22px">
    ${box("1. 확인", ["로그인 · 볼 수 있는 세계관", "열린 이벤트가 있으면 끝냄", "기본 모델 사용량 잡기", "성인 확인(매 턴 DB)"], "#d6336f")}
    ${box("2. 맥락 조립", ["세계관 설명·규칙", "등장인물(지금 있는 곳)", "지금 파트의 방향(목표는 숨김)", "장소·그림 이름표·최근 16개"], "#d6336f")}
    ${box("3. 진행자 답", ["FastAPI /world/turn", "대화 방식 4가지 형식", "수위 규칙(1:1 대화와 같음)", "끝에 [그림:] [이동:] 제어 줄"], "#2b6fd6")}
    ${box("4. 제어 줄 검사", ["없는 그림 이름표는 버림", "명단 밖 인물·장소는 버림", "본문에서 떼어 냄", "장면 그림 · 인물 위치 반영"], "#2b6fd6")}
  </div>
  <div style="text-align:center;font-size:24px;color:#b45cff;margin:8px 0">↓</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
    ${box("5. 파트 판정 (3턴마다)", ["/world/part-check, 온도 0", "근거 인용이 대화에 그대로 있어야", "통과하면 다음 파트 · 시작 글"], "#6d4dff")}
    ${box("6. 이벤트 (서버가 확률로)", ["간격 6턴 · 확률 35% (콘솔에서 바꿈)", "사다리·주사위·볼링·제비·미로", "결과는 서버가 정한다"], "#1c8a5a")}
    ${box("7. 보상", ["승리 20~50 · 패배 5~10 코레딧", "계정당 하루 3번까지", "계정별 잠금으로 동시 요청도 한도 안"], "#1c8a5a")}
  </div>
  <div style="margin-top:18px;padding:14px 18px;border-radius:14px;background:#f1edff;font-size:17px">
    <b>모델은 고르기만 하고, 확인과 돈이 걸린 일은 코드가 한다.</b> 진행자가 없는 그림·장소를 지어내도 화면에 나가지 않고, 미니게임의 당첨 위치는 화면에 보내지 않는다.
  </div>
</div>`;

const feature = (icon, title, lines, tone) => `
  <div style="border-radius:18px;padding:16px 18px;background:#fff;border:2px solid ${tone}33">
    <div style="font-size:26px">${icon}</div>
    <div style="font-size:19px;font-weight:800;color:${tone};margin-top:4px">${title}</div>
    <div style="font-size:14px;line-height:1.55;color:#4a4266;margin-top:6px">${lines.join("<br>")}</div>
  </div>`;
const features = `
<div style="width:1280px;height:690px;padding:32px 44px;background:#fbfaff">
  <div style="font-size:30px;font-weight:800">기능 지도</div>
  <div style="font-size:16px;color:#6b6388;margin-top:4px">1:1 캐릭터 대화를 중심으로 이야기를 넓히는 기능과, 한 세계관 안의 여러 인물과 이어 가는 월드코퍼챗</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px">
    ${feature("💬", "캐릭터 대화", ["기억·지난 이야기·친밀도", "복선·엑스트라·대답 추천", "@: 나레이션 · /다시 /계속"], "#6d4dff")}
    ${feature("🔐", "비밀 퀘스트", ["친밀도 문턱 → 부탁", "인용 근거로 달성 판정", "보상 장면 · 코레딧"], "#6d4dff")}
    ${feature("🎭", "오퍼레이션", ["심리 탐구 · 일기", "메시지 · 커뮤니티", "웹툰"], "#6d4dff")}
    ${feature("🖼️", "코디포토넷", ["대화 장면을 그림으로", "화풍 4가지", "수위별 그림 검수"], "#6d4dff")}
    ${feature("🌍", "월드코퍼챗", ["한 세계관 · 여러 인물", "진행자가 번갈아 연기", "누구나 만들고 공개 범위 선택"], "#d6336f")}
    ${feature("📖", "대화 방식 4가지", ["기본 채팅(장면 그림)", "비주얼노벨 · 소설", "메신저(카톡형)"], "#d6336f")}
    ${feature("🗺️", "파트 · 코퍼맵", ["목표를 이루면 다음 파트", "지도 위 장소 핀", "인물이 지금 있는 곳"], "#d6336f")}
    ${feature("🎲", "이벤트 미니게임", ["사다리·주사위·볼링·제비·미로", "승리 20~50 · 패배 5~10", "하루 3번까지 보상"], "#d6336f")}
    ${feature("🛠️", "캐릭터 공방", ["8단계 카드 · AI 초안", "3턴 테스트 후 발행", "초상(파일·AI)"], "#2b6fd6")}
    ${feature("🪙", "코레딧 · 모델", ["출석 · 차감 · 실패 시 환불", "기본·강화·프리미엄 모델", "프로 등급(임시)"], "#2b6fd6")}
    ${feature("🔞", "수위", ["전체 이용가가 기본", "성인 확인 계정만 성인 수위", "미성년자·강제 단서는 코드가 막음"], "#2b6fd6")}
    ${feature("🧭", "운영 콘솔", ["신고 · 초상·그림 검수", "세계관 내리기 · 이벤트 기록", "운영 설정 · 계정 등급"], "#1c8a5a")}
  </div>
</div>`;

// 데모 세계관 그림 (실제 그림 엔진이 아니라 HTML로 그린 예시. README에 그렇게 적는다)
const sea = "linear-gradient(180deg,#0b1d3a 0%,#123a66 55%,#1d5e8f 100%)";
const demoMap = `
<div style="width:1280px;height:800px;position:relative;overflow:hidden;background:${sea};font-family:${FONT}">
  <div style="position:absolute;left:-80px;top:260px;width:900px;height:620px;border-radius:46% 54% 40% 60%;background:linear-gradient(160deg,#d9c79a,#b9a46f);box-shadow:0 0 0 18px rgba(255,255,255,.08)"></div>
  <div style="position:absolute;left:640px;top:520px;width:520px;height:340px;border-radius:50% 40% 30% 60%;background:linear-gradient(160deg,#cdbb8c,#a8935f)"></div>
  <div style="position:absolute;left:980px;top:80px;width:220px;height:220px;border-radius:50%;background:linear-gradient(160deg,#c9b787,#9e8a56)"></div>
  <div style="position:absolute;left:180px;top:430px;width:520px;height:16px;background:#8a6f45;border-radius:8px;transform:rotate(-8deg)"></div>
  <div style="position:absolute;left:480px;top:600px;width:340px;height:14px;background:#8a6f45;border-radius:8px;transform:rotate(14deg)"></div>
  ${Array.from({ length: 26 }, (_, i) => `<div style="position:absolute;left:${(i * 137) % 1280}px;top:${(i * 89) % 240}px;width:${40 + (i % 5) * 12}px;height:3px;border-radius:2px;background:rgba(255,255,255,.18)"></div>`).join("")}
  <div style="position:absolute;right:40px;bottom:30px;color:#f6efe1;font-size:20px;letter-spacing:.2em;opacity:.8">SERENA HARBOR · 세레나 항구</div>
  <div style="position:absolute;left:40px;top:30px;width:90px;height:90px;border:3px solid rgba(255,255,255,.5);border-radius:50%;color:#fff;display:grid;place-items:center;font-size:30px">N</div>
</div>`;
const scene = (top, bottom, extra = "") => `
<div style="width:1280px;height:720px;position:relative;overflow:hidden;background:linear-gradient(180deg,${top},${bottom})">${extra}</div>`;
const lighthouse = `
  <div style="position:absolute;left:820px;top:140px;width:90px;height:460px;background:repeating-linear-gradient(180deg,#f2f2f2 0 60px,#c0392b 60px 120px);clip-path:polygon(20% 0,80% 0,100% 100%,0 100%)"></div>
  <div style="position:absolute;left:600px;top:60px;width:560px;height:200px;background:radial-gradient(closest-side,rgba(255,236,170,.75),transparent);transform:rotate(-12deg)"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:150px;background:#0b2340"></div>`;
const dock = `
  <div style="position:absolute;left:0;right:0;bottom:0;height:260px;background:linear-gradient(180deg,#123a66,#081a33)"></div>
  <div style="position:absolute;left:120px;bottom:180px;width:760px;height:26px;background:#5b4630"></div>
  ${[160, 320, 480, 640, 800].map((x) => `<div style="position:absolute;left:${x}px;bottom:120px;width:16px;height:90px;background:#3e2f20"></div>`).join("")}
  <div style="position:absolute;left:860px;bottom:150px;width:330px;height:120px;background:#1b1b26;clip-path:polygon(0 30%,100% 30%,88% 100%,10% 100%)"></div>
  <div style="position:absolute;left:980px;bottom:250px;width:10px;height:200px;background:#1b1b26"></div>
  ${Array.from({ length: 40 }, (_, i) => `<div style="position:absolute;left:${(i * 53) % 1280}px;top:${(i * 37) % 300}px;width:2px;height:2px;border-radius:50%;background:#fff;opacity:.7"></div>`).join("")}`;
const market = `
  <div style="position:absolute;left:0;right:0;bottom:0;height:220px;background:#6b4f33"></div>
  ${[60, 360, 660, 960].map((x, i) => `<div style="position:absolute;left:${x}px;bottom:200px;width:260px;height:150px;background:${["#c0392b", "#2b6fd6", "#1c8a5a", "#b45cff"][i]};clip-path:polygon(0 0,100% 0,90% 100%,10% 100%);opacity:.9"></div><div style="position:absolute;left:${x + 20}px;bottom:120px;width:220px;height:90px;background:#3e2f20"></div>`).join("")}`;
const sprite = (hair, coat) => `
<div style="width:600px;height:900px;position:relative;background:transparent">
  <div style="position:absolute;left:210px;top:120px;width:180px;height:200px;border-radius:50% 50% 46% 46%;background:#f3d4bf"></div>
  <div style="position:absolute;left:190px;top:80px;width:220px;height:150px;border-radius:50% 50% 30% 30%;background:${hair}"></div>
  <div style="position:absolute;left:150px;top:310px;width:300px;height:560px;border-radius:120px 120px 20px 20px;background:${coat}"></div>
  <div style="position:absolute;left:250px;top:210px;width:16px;height:16px;border-radius:50%;background:#2a2238"></div>
  <div style="position:absolute;left:334px;top:210px;width:16px;height:16px;border-radius:50%;background:#2a2238"></div>
</div>`;

export const DEMO_ART = { map: demoMap, dock: scene("#0b1d3a", "#1d3f6e", dock), lighthouse: scene("#101a3a", "#3a2c5e", lighthouse), market: scene("#f6c47a", "#f1e3c2", market), seorin: sprite("#2a2238", "#3b4a7a"), doyun: sprite("#5a4632", "#2f3b2f") };

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  await render(browser, banner, join(OUT, "banner.png"), { height: 380 });
  await render(browser, architecture, join(OUT, "architecture.png"), { height: 700 });
  await render(browser, stack, join(OUT, "stack.png"), { height: 640 });
  await render(browser, worldFlow, join(OUT, "world-flow.png"), { height: 580 });
  await render(browser, features, join(OUT, "features.png"), { height: 690 });
  await render(browser, turn, join(OUT, "chat-turn.png"), { height: 540 });
  await render(browser, card("코디컴퍼챗", "어제의 이야기를 기억하는 캐릭터와 이어 가는 캠페인", "실제로 띄운 앱의 화면입니다"), join(TMP, "card-intro.png"));
  await render(browser, card("끝까지 기억하는 동행", "기억 · 관계 · 복선 · 비밀 퀘스트 · 장면 그림 · 웹툰 · 공방", "개발 단계이며 아직 공개 서비스가 아닙니다"), join(TMP, "card-outro.png"));
  await browser.close();
}
