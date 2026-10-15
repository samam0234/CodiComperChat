// 부하 측정. 서버 둘(가짜 LLM의 FastAPI + Nest)을 e2e 구성으로 띄워 가상 이용자를 동시에 돌리고 지연·오류율을 표로 보여 준다.
//
//   npm run bench                                  # 기본: 읽기 부하 + 대화(모델 지연 1.5초·한 번에 하나)
//   npm run bench -- --users 12 --delay 3000       # 이용자 12명, 모델 호출 3초
//   npm run bench -- --only read                   # 읽기 부하만
//
// 결과는 이 기계·이 설정 기준의 상대적인 비교용이다(고치기 전후). 절대 성능 보증이 아니다.
import { spawn } from "node:child_process";
import { join } from "node:path";
import { AUTH_SECRET, E2E_DB, PERSONA_DIR, PORTS, ROOT, URLS } from "./env.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const USERS = Number(arg("users", 8));
const DELAY = Number(arg("delay", 1500));
const ONLY = arg("only", "");
const READ_SECONDS = Number(arg("seconds", 8));

function run(cmd, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, ...env }, shell: process.platform === "win32" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} → ${code}`))));
  });
}
const servers = [];
function start(cmd, args, cwd, env) {
  const child = spawn(cmd, args, { cwd, stdio: "ignore", env: { ...process.env, ...env } });
  servers.push(child);
  return child;
}
async function waitFor(url) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${url}가 뜨지 않았다`);
}
const stopAll = () => servers.forEach((s) => s.kill());
process.on("SIGINT", () => (stopAll(), process.exit(1)));

const api = async (path, { token, json, method } = {}) => {
  const started = performance.now();
  const res = await fetch(URLS.api + path, {
    method: method ?? (json ? "POST" : "GET"),
    headers: { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: json ? JSON.stringify(json) : undefined,
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body, ms: performance.now() - started };
};

const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0);
function summarize(label, samples, errors, seconds) {
  const sorted = [...samples].sort((a, b) => a - b);
  const row = { 시나리오: label, 요청수: samples.length + errors, 오류: errors, "처리량/초": +((samples.length + errors) / seconds).toFixed(1), "p50(ms)": Math.round(pct(sorted, 50)), "p95(ms)": Math.round(pct(sorted, 95)), "최대(ms)": Math.round(sorted.at(-1) ?? 0) };
  return row;
}

async function signupUsers(n) {
  const users = [];
  for (let i = 0; i < n; i++) {
    const email = `bench${Date.now() % 100000}${i}@e2e.test`;
    const res = await api("/auth/signup", { json: { email, password: "pass1234word", displayName: `부하${i}` } });
    const token = res.body.token;
    const persona = (await api("/me/personas", { token, json: { name: `주인공${i}`, description: "" } })).body.id;
    users.push({ token, persona });
  }
  return users;
}

async function readLoad(users) {
  const paths = ["/characters", "/me/conversations", "/auth/me", "/studio/characters", "/characters/e2e-official/chat", "/characters/e2e-official/chat/story"];
  const samples = [];
  let errors = 0;
  const end = Date.now() + READ_SECONDS * 1000;
  await Promise.all(
    users.map(async (user, i) => {
      let k = i;
      while (Date.now() < end) {
        const res = await api(paths[k++ % paths.length], { token: user.token });
        if (res.status >= 400) errors++;
        else samples.push(res.ms);
      }
    }),
  );
  return summarize(`읽기 ${users.length}명 동시`, samples, errors, READ_SECONDS);
}

// 대화: 이용자마다 3번(= 기억·이야기 정리가 뒤에서 한 번 돈다) 순서대로 보내고, 답 속도와 "정리가 끝나기까지"를 잰다
async function chatLoad(users) {
  const samples = [];
  let errors = 0;
  const started = performance.now();
  const digestLag = [];
  await Promise.all(
    users.map(async (user) => {
      for (const m of ["안녕하세요", "오늘 힘들었어요", "고마워요"]) {
        const res = await api("/characters/e2e-official/chat", { token: user.token, json: { message: m, personaId: user.persona } });
        if (res.status >= 400) errors++;
        else samples.push(res.ms);
      }
      const sentAt = performance.now();
      for (let i = 0; i < 400; i++) {
        const story = (await api("/characters/e2e-official/chat/story", { token: user.token })).body;
        if (story?.brief) break;
        await new Promise((r) => setTimeout(r, 250));
      }
      digestLag.push(performance.now() - sentAt);
    }),
  );
  const seconds = (performance.now() - started) / 1000;
  const sortedLag = digestLag.sort((a, b) => a - b);
  return [summarize(`대화 ${users.length}명 동시(답 속도)`, samples, errors, seconds), { 시나리오: "└ 마지막 답 뒤 이야기 정리 완료까지", 요청수: digestLag.length, 오류: 0, "처리량/초": "-", "p50(ms)": Math.round(pct(sortedLag, 50)), "p95(ms)": Math.round(pct(sortedLag, 95)), "최대(ms)": Math.round(sortedLag.at(-1) ?? 0) }];
}

// 이어지는 대화: 이용자마다 9번(= 뒤에서 기억·이야기 정리가 세 번 돈다) 쉬지 않고 보낸다.
// 배경 작업이 사용자가 기다리는 답을 얼마나 막는지가 핵심이다
async function sustainedLoad(users) {
  const samples = [];
  let errors = 0;
  const started = performance.now();
  await Promise.all(
    users.map(async (user) => {
      for (let i = 0; i < 9; i++) {
        const res = await api("/characters/e2e-official/chat", { token: user.token, json: { message: `이어지는 말 ${i + 1}`, personaId: user.persona } });
        if (res.status >= 400) errors++;
        else samples.push(res.ms);
      }
    }),
  );
  return summarize(`이어지는 대화 ${users.length}명 x 9번(답 속도)`, samples, errors, (performance.now() - started) / 1000);
}

await run("node", ["e2e/prepare.mjs"], ROOT);
start(join(ROOT, "services", "ai", ".venv", process.platform === "win32" ? "Scripts" : "bin", process.platform === "win32" ? "python.exe" : "python"), ["-m", "uvicorn", "app.main:app", "--port", String(PORTS.ai)], join(ROOT, "services", "ai"), { LLM_FAKE: "1", FAKE_LLM_DELAY_MS: String(DELAY), FAKE_LLM_SERIAL: "1" });
start(process.execPath, ["dist-verify/main.js"], join(ROOT, "apps", "api"), { PORT: String(PORTS.api), DATABASE_URL: E2E_DB, AI_BASE_URL: URLS.ai, AUTH_SECRET, PERSONA_DATA_DIR: PERSONA_DIR, RATE_LIMIT: "off" });
try {
  await waitFor(`${URLS.ai}/health`);
  await waitFor(`${URLS.api}/health`);
  console.log(`\n측정 조건: 이용자 ${USERS}명, 모델 호출 ${DELAY}ms·한 번에 하나(가짜 LLM), 한도 꺼짐, 이 기계의 로컬 DB\n`);
  const rows = [];
  if (ONLY !== "chat") rows.push(await readLoad(await signupUsers(USERS)));
  if (ONLY !== "read" && ONLY !== "sustained") rows.push(...(await chatLoad(await signupUsers(USERS))));
  if (ONLY !== "read" && ONLY !== "chat") rows.push(await sustainedLoad(await signupUsers(USERS)));
  console.table(rows);
} finally {
  stopAll();
}
