// 문서용 구조 그림 (2026-11-06). HTML로 그려 PNG로 남긴다 — 서버가 필요 없다.
//   node scripts/readme-media/diagrams.mjs
// 값은 저장소에서 읽은 사실만 쓴다: 배포는 deploy/docker-compose.prod.yml, 포트는 e2e/env.mjs·scripts/readme-media/env.mjs,
// 테이블은 apps/api/prisma/schema.prisma, 화면은 app/**/page.tsx, CI는 .github/workflows/ci.yml
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { render } from "./art.mjs";
import { OUT } from "./env.mjs";

const C = { web: "#6d4dff", api: "#d6336f", ai: "#2b6fd6", db: "#1c8a5a", ops: "#8a6d00", muted: "#8a84a3" };
const head = (title, sub) => `
  <div style="font-size:30px;font-weight:800">${title}</div>
  <div style="font-size:16px;color:#6b6388;margin-top:4px">${sub}</div>`;
const card = (title, lines, tone, extra = "") => `
  <div style="border:2px solid ${tone};border-radius:14px;padding:10px 14px;background:#fff;${extra}">
    <div style="font-weight:800;font-size:17px;color:${tone}">${title}</div>
    ${lines.length ? `<div style="font-size:13.5px;line-height:1.5;color:#4a4266;margin-top:4px">${lines.join("<br>")}</div>` : ""}
  </div>`;
const down = (label = "") => `<div style="text-align:center;font-size:12.5px;color:#7a7296;line-height:1.2;margin:4px 0">${label}${label ? "<br>" : ""}<span style="font-size:20px;color:#b45cff">↓</span></div>`;
const page = (w, h, body) => `<div style="width:${w}px;height:${h}px;padding:30px 40px;background:#fbfaff">${body}</div>`;

// 1. 계층 (Next · Nest · FastAPI)
const layers = page(1280, 660, `${head("계층 구조", "요청은 위에서 아래로만 흐른다. 웹은 FastAPI를 모르고, FastAPI는 DB를 모른다")}
  <div style="display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:18px;margin-top:20px">
    <div>
      ${card("apps/web · console (Next.js 16)", ["화면 35개 · 콘솔 12개, 요청마다 nonce CSP"], C.web)}
      ${down()}
      ${card("서버 컴포넌트", ["lib/*.ts: 로그인 쿠키의 토큰을 붙여 Nest 조회", "server-only — 토큰이 브라우저로 가지 않는다"], C.web)}
      ${down()}
      ${card("클라이언트 컴포넌트", ["서버 액션(app/actions) 또는", "app/api/** 중계(Route Handler)", "그림은 중계가 sandbox CSP로 흘려보냄"], C.web)}
      ${down("Authorization: Bearer")}
    </div>
    <div>
      ${card("Controller (apps/api, Nest.js 12)", ["AuthGuard · AdminGuard · RateLimitGuard", "@CurrentUserId, 요청 본문 모양 검사"], C.api)}
      ${down()}
      ${card("Service", ["권한·소유·공개 범위 확인, 코레딧, 모델 조건", "맥락 조립(카드·지식 조각·기억·이야기 상태)", "트랜잭션·잠금(보상·차감)"], C.api)}
      ${down()}
      ${card("순수 함수 *.ts + *.spec.ts", ["quest.ts · world.ts · card.ts · adult.ts …", "DB 없이 시험 (vitest 226개)"], C.api)}
      ${down()}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${card("Prisma 7", ["PostgreSQL 16", "테이블 37개"], C.db)}
        ${card("ai-client", ["AI 대기열", "동시 수 제한·답 우선"], C.api)}
      </div>
    </div>
    <div>
      ${card("routes (services/ai, FastAPI)", ["/infer /summarize /world/turn …", "내부 토큰(AI_SERVICE_TOKEN)만 통과"], C.ai)}
      ${down()}
      ${card("schemas (WireModel)", ["통신은 camelCase, 파이썬은 snake_case", "길이·개수 한도를 여기서"], C.ai)}
      ${down()}
      ${card("services", ["inference · summarization · world", "grounding · operations · webtoon", "photonet · image_moderation · minors"], C.ai)}
      ${down()}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${card("llm.py", ["Ollama gemma4", "가짜 LLM(e2e)", "Claude·Grok(키 있을 때)"], C.ai)}
        ${card("image_engine", ["diffusers", "Animagine XL 4.0", "SD 1.5 · GPU"], C.ai)}
      </div>
    </div>
  </div>`);

// 2. 운영 배포 (deploy/docker-compose.prod.yml)
const deploy = page(1280, 800, `${head("운영 배포 구성", "GPU 서버 한 대, Docker Compose. 바깥에는 Caddy의 80·443만 열린다 (deploy/docker-compose.prod.yml)")}
  <div style="display:grid;grid-template-columns:1fr;gap:6px;margin-top:18px">
    ${card("인터넷 → caddy:2.10 (80 · 443, 자동 HTTPS)", ["WEB_DOMAIN → web:3000 · CONSOLE_DOMAIN → console:3001 (CONSOLE_CADDY_ALLOW 밖의 IP는 403)"], C.muted)}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px">
    <div>${down("edge 망")}${card("web (Next.js)", ["node.Dockerfile · 이용자 사이트", "edge + internal 망"], C.web)}</div>
    <div>${down("edge 망")}${card("console (Next.js)", ["운영자 전용, 쿠키가 따로", "edge + internal 망"], C.web)}</div>
  </div>
  ${down("internal 망 · Bearer 토큰")}
  ${card("api (Nest.js) :4000 — 유일한 신뢰 경계", ["인증·권한·코레딧·결제·맥락 조립·월드 판정 반영 · 볼륨 personas(지식 JSON) · healthcheck /health"], C.api)}
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:4px">
    <div>${down("Prisma")}${card("postgres:16-alpine", ["볼륨 pgdata", "그림(bytea)도 여기"], C.db)}${down("기동 때 한 번")}${card("migrate", ["prisma migrate deploy (34개)"], C.db)}</div>
    <div>${down("AI_SERVICE_TOKEN")}${card("ai (FastAPI) :8000", ["ai.Dockerfile · IMAGE_ENGINE=local", "체크포인트: 서버 폴더 → /models (읽기 전용)", "hf_cache 볼륨 · NVIDIA GPU"], C.ai)}</div>
    <div>${down("내부망")}${card("ollama:0.40", ["gemma4:e4b · gemma4:12b", "볼륨 ollama(모델)", "GPU를 그림 엔진과 나눠 쓴다"], C.ai)}</div>
  </div>
  <div style="margin-top:14px;padding:12px 16px;border-radius:12px;background:#f1edff;font-size:15px">
    <b>바깥에서 api·ai·postgres·ollama에 직접 닿는 길은 없다.</b> 운영 기본값 <code>ADULT_MODE=off</code>. 백업은 <code>scripts/db-backup.sh</code> → <a>web_management/backup-restore.md</a>
  </div>`);

// 3. 실행 환경 셋 (개발 · e2e · README 데모)
const env = (title, tone, rows, foot) => `
  <div style="border:2px solid ${tone};border-radius:16px;padding:14px 16px;background:#fff">
    <div style="font-weight:800;font-size:19px;color:${tone}">${title}</div>
    <table style="width:100%;margin-top:8px;border-collapse:collapse;font-size:14.5px">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 0;color:#6b6388;width:42%">${k}</td><td style="padding:4px 0;font-weight:700">${v}</td></tr>`).join("")}
    </table>
    <div style="font-size:13px;color:#6b6388;margin-top:8px;line-height:1.5">${foot}</div>
  </div>`;
const ports = page(1280, 430, `${head("로컬 실행 환경 세 벌", "포트와 DB가 겹치지 않아 동시에 켜 둘 수 있다 (같은 PostgreSQL 서버, 데이터베이스만 다르다)")}
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px">
    ${env("개발 (사용자가 켠다)", C.web, [["web", "3000"], ["console", "3001"], ["api", "4000"], ["ai", "8000"], ["DB", "codicomperchat"], ["모델", "실제 Ollama"]], "npm run dev:web · dev:console · dev:api, uvicorn. 켜져 있을 때 <b>npm run build:api 금지</b>(dist를 지워 서버가 죽는다)")}
    ${env("e2e (npm run test:e2e)", C.api, [["web", "3101"], ["console", "3102"], ["api", "4101"], ["ai", "8101"], ["DB", "codicomperchat_e2e"], ["모델", "가짜 LLM·가짜 그림"]], "운영 빌드(.next-e2e · dist-verify)로 돈다. 실행마다 DB를 새로 만든다. E2E_SKIP_BUILD=1이면 빌드를 건너뛴다")}
    ${env("README 데모 (servers.mjs)", C.ai, [["web", "3201"], ["console", "3202"], ["api", "4201"], ["ai", "8201"], ["DB", "codicomperchat_readme"], ["모델", "실제 Ollama·그림 엔진"]], "README 그림·영상을 찍을 때만. example.com 가짜 계정, ADULT_MODE=off")}
  </div>`);

// 4. DB 지도 (schema.prisma 모델 37개를 영역별로)
const group = (title, tone, models, note) => `
  <div style="border:2px solid ${tone}55;border-radius:14px;padding:10px 12px;background:#fff">
    <div style="font-weight:800;font-size:16px;color:${tone}">${title} <span style="font-weight:600;color:#8a84a3;font-size:13px">${models.length}</span></div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">${models.map((m) => `<span style="padding:3px 8px;border-radius:8px;background:${tone}14;color:${tone};font-size:12.5px;font-weight:700">${m}</span>`).join("")}</div>
    <div style="font-size:12.5px;color:#6b6388;margin-top:6px;line-height:1.45">${note}</div>
  </div>`;
const erd = page(1280, 720, `${head("데이터 지도 — 테이블 37개", "apps/api/prisma/schema.prisma의 모델을 영역별로 묶었다. → 는 주요 관계, Cascade는 부모를 지우면 함께 지워짐")}
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px">
    ${group("계정·코레딧·결제", C.web, ["User", "UserPersona", "EmailToken", "CreditLedger", "Attendance", "ModelUsage", "PaymentOrder", "QuestReward", "RateLimitBucket"], "User가 뿌리. 계정을 지우면 대부분 Cascade. credits는 User에, 변동은 CreditLedger(사유 ATTENDANCE·MODEL_USE·REFUND·ADMIN·OPERATION·QUEST·EVENT)")}
    ${group("캐릭터·공방", C.api, ["Character", "CharacterDraft", "UserExtra"], "Character(공개 카드, 비밀·퀘스트 JSON) ← CharacterDraft(공방 초안, 3턴 테스트). 만든 사람이 지워지면 ownerId만 비운다")}
    ${group("대화·이야기 상태", C.ai, ["Campaign", "CampaignState", "Session", "Message", "MemoryChunk", "CampaignExtra"], "User × Character = Campaign → CampaignState(친밀도·복선·요약·퀘스트 상태) · Session → Message · MemoryChunk(장기 기억)")}
    ${group("오퍼레이션·그림", C.db, ["MindReading", "DiaryEntry", "DirectMessage", "BoardPost", "BoardComment", "PhotonetImage", "Webtoon", "WebtoonPanel"], "모두 Campaign에 매달린다. 그림은 bytea, 수위(sfw·nsfw)와 막힘 기록")}
    ${group("신고·운영", C.ops, ["CharacterReport", "ContentReport", "AppSetting"], "캐릭터 신고 → 내리기. 그림·웹툰(·세계관) 신고는 외래 키 없이 targetId. AppSetting: 콘솔에서 바꾸는 운영 설정")}
    ${group("월드코퍼챗 (2026-11-06)", "#d6336f", ["World", "WorldCast", "WorldPlace", "WorldPart", "WorldImage", "WorldPlay", "WorldMessage", "WorldEvent"], "World → 인물·장소·파트·그림 (Cascade). User × World = WorldPlay → WorldMessage · WorldEvent(숨긴 setup, 보상, rewardDay)")}
  </div>
  <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px">
    ${card("돈과 횟수는 DB 한 문장으로", ["차감: UPDATE … WHERE credits >= n RETURNING · 하루 한도: INSERT … ON CONFLICT DO UPDATE WHERE count < 한도", "보상: QuestReward 기본키(계정×캐릭터 한 번) · 월드 이벤트는 계정별 advisory lock 안에서 셈"], C.web)}
    ${card("마이그레이션 34개", ["apps/api/prisma/migrations/ · 운영은 migrate 컨테이너가 기동 때 deploy", "개발: npx prisma migrate deploy · 새로 만들 때는 migrate diff로 SQL을 만들어 확인"], C.db)}
  </div>`);

// 5. 화면 지도
const route = (path, desc) => `<div style="display:flex;gap:8px;font-size:13.5px;line-height:1.55"><code style="color:#4b2fd6;font-weight:700;white-space:nowrap">${path}</code><span style="color:#4a4266">${desc}</span></div>`;
const screens = page(1280, 630, `${head("화면 지도", "이용자 사이트 35개(apps/web/app/**/page.tsx)와 운영 콘솔 12개(console/app/**/page.tsx)")}
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:16px">
    <div style="display:grid;gap:10px;align-content:start">
      ${card("둘러보기·계정", [], C.web, "padding-bottom:12px")}
      ${route("/", "홈 · 이어서 대화하기")}${route("/popular", "인기")}${route("/characters/[id]", "캐릭터 상세")}${route("/agents", "안내 도우미")}
      ${route("/signup · /login", "가입·로그인")}${route("/verify-email", "이메일 인증")}${route("/forgot-password · /reset-password", "비밀번호")}
      ${route("/me", "마이페이지 · 내 프로필")}${route("/settings", "테마·수위·성인 확인")}${route("/library", "대화 목록")}
      ${route("/pricing · /billing/*", "요금·결제 결과")}${route("/terms · /privacy · /business · /support", "약관·안내")}
    </div>
    <div style="display:grid;gap:10px;align-content:start">
      ${card("대화와 오퍼레이션", [], C.api, "padding-bottom:12px")}
      ${route("/characters/[id]/chat", "대화 · 코디포토넷 창 · 비밀 퀘스트")}
      ${route("…/chat/memories", "기억")}${route("…/chat/settings", "상태설정·엑스트라")}${route("…/chat/saved", "저장한 대화")}
      ${route("…/chat/mind", "심리 탐구")}${route("…/chat/diary", "일기")}${route("…/chat/messages", "메시지")}${route("…/chat/community", "커뮤니티")}${route("…/chat/webtoon", "웹툰")}
      ${card("캐릭터 공방", [], C.api, "padding-bottom:12px;margin-top:6px")}
      ${route("/studio", "내 초안")}${route("/studio/[id]", "8단계 카드 · 3턴 테스트 · 초상")}
    </div>
    <div style="display:grid;gap:10px;align-content:start">
      ${card("월드코퍼챗", [], "#d6336f", "padding-bottom:12px")}
      ${route("/worlds", "목록 · 새로 만들기")}${route("/worlds/[id]", "소개 · 코퍼맵 · 시작")}${route("/worlds/[id]/edit", "편집기 6탭")}${route("/worlds/[id]/play", "방식 4가지 · 이벤트")}
      ${card("운영 콘솔 (:3001, 운영자만)", [], C.ops, "padding-bottom:12px;margin-top:6px")}
      ${route("/", "대시보드")}${route("/reports", "캐릭터 신고")}${route("/content", "그림 신고")}${route("/portraits", "초상 검수")}
      ${route("/characters", "캐릭터 관리")}${route("/users", "계정 등급·정지")}${route("/worlds …", "월드 목록·상세·검수·이벤트·설정")}${route("/login", "콘솔 로그인")}
    </div>
  </div>`);

// 6. CI (.github/workflows/ci.yml) — 로컬은 npm run ci:local이 같은 단계
const step = (n, t) => `<div style="display:flex;gap:10px;align-items:center;padding:7px 10px;border-radius:10px;background:#fff;border:1px solid #e4def5;font-size:14.5px"><b style="color:#b45cff;width:20px">${n}</b>${t}</div>`;
const ci = page(1280, 530, `${head("CI — 병합 전 확인", ".github/workflows/ci.yml · 로컬에서는 npm run ci:local이 깨끗한 클론에서 같은 단계를 돈다")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">
    <div style="display:grid;gap:6px;align-content:start">
      ${card("checks 잡 (PostgreSQL 16 서비스)", [], C.api, "padding-bottom:12px")}
      ${step(1, "npm ci")}${step(2, "Prisma 생성 · 마이그레이션 적용")}${step(3, "oxlint --deny-warnings (경고도 실패)")}${step(4, "타입 검사 api · web · console")}
      ${step(5, "API 단위 테스트 (vitest 226)")}${step(6, "커밋 기록 작성기 · 에이전트 어댑터 시험 (36)")}${step(7, "AI 서비스 불러오기 (compileall, import app.main)")}${step(8, "AI 단위 시험 (unittest 54)")}
    </div>
    <div style="display:grid;gap:6px;align-content:start">
      ${card("e2e 잡", [], C.web, "padding-bottom:12px")}
      ${step(1, "npm ci · Prisma 생성")}${step(2, "AI 서비스 가상환경 (services/ai/.venv)")}${step(3, "웹 화면 자동 테스트 (Playwright 123, 운영 빌드)")}${step(4, "성인 모드를 끈 서버의 화면 시험 (1)")}${step(5, "실패하면 화면·추적을 올린다")}
      ${card("CI에 없는 것 (사람이 돌린다)", ["실제 모델 평가 python -m evals.* (GPU·Ollama 필요)", "부하 측정 npm run bench · README 그림 scripts/readme-media"], C.muted, "margin-top:10px")}
    </div>
  </div>`);

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
await render(browser, layers, join(OUT, "layers.png"), { height: 660 });
await render(browser, deploy, join(OUT, "deploy-topology.png"), { height: 800 });
await render(browser, ports, join(OUT, "dev-environments.png"), { height: 430 });
await render(browser, erd, join(OUT, "data-map.png"), { height: 720 });
await render(browser, screens, join(OUT, "screen-map.png"), { height: 630 });
await render(browser, ci, join(OUT, "ci-pipeline.png"), { height: 530 });
await browser.close();
console.log("구조 그림 6장");
