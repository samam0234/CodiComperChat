// .github/workflows/ci.yml과 같은 단계를 "지금 커밋의 깨끗한 클론"에서 돌린다 — 내 PC에만 있는 파일·설치물·환경변수에 기대는 곳을 찾는다.
//   npm run ci:local            checks + e2e
//   npm run ci:local -- checks  린트·타입 검사·단위 테스트·AI 서비스만
//   npm run ci:local -- e2e     웹 화면 자동 테스트만
// 클론은 e2e/.tmp/ci-clone(git 제외), DB는 개발 DB와 같은 서버의 codicomperchat_ci·codicomperchat_ci_e2e를 매번 새로 만든다
// (개발 DB는 건드리지 않는다). 접속 정보는 apps/api/.env의 DATABASE_URL에서 이름만 바꿔 쓰고 출력하지 않는다.
// 커밋하지 않은 변경은 클론에 들어가지 않는다.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const which = process.argv[2] ?? 'all';
const clone = join(ROOT, 'e2e', '.tmp', 'ci-clone');
const logs = join(ROOT, 'e2e', '.tmp', 'ci-logs');
const pg = createRequire(join(ROOT, 'apps', 'api', 'package.json'))('pg');

const devUrl = readFileSync(join(ROOT, 'apps', 'api', '.env'), 'utf8').match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m)?.[1];
if (!devUrl) throw new Error('apps/api/.env에 DATABASE_URL이 없다');
const dbUrl = (name) => {
  const u = new URL(devUrl);
  u.pathname = `/${name}`;
  return u.toString();
};

async function freshDb(name) {
  const admin = new pg.Client({ connectionString: dbUrl('postgres') });
  await admin.connect();
  await admin.query(`drop database if exists ${name} with (force)`);
  await admin.query(`create database ${name}`);
  await admin.end();
}

// 1) 지금 커밋으로 깨끗한 클론
rmSync(clone, { recursive: true, force: true });
mkdirSync(logs, { recursive: true });
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
execFileSync('git', ['clone', '-q', ROOT, clone], { stdio: 'inherit' });
execFileSync('git', ['checkout', '-q', head], { cwd: clone });
console.log(`클론: ${head.slice(0, 7)}`);

const results = [];
function step(name, cmd, cwd, env = {}) {
  const t0 = Date.now();
  // CI처럼: 개발 PC의 DB·키 같은 환경변수는 넘기지 않고 필요한 것만 준다
  const base = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => !/^(DATABASE_URL|E2E_|AUTH_SECRET|API_BASE_URL|RATE_LIMIT|MAIL_|TOSS_|BILLING_|LLM_|OLLAMA_)/.test(k)),
  );
  const r = spawnSync(cmd, { cwd: join(clone, cwd), env: { ...base, ...env, CI: 'true' }, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const ok = r.status === 0;
  const sec = Math.round((Date.now() - t0) / 1000);
  const log = join(logs, `${results.length + 1}.log`);
  writeFileSync(log, `${r.stdout ?? ''}\n${r.stderr ?? ''}`);
  results.push({ name, ok, sec });
  console.log(`${ok ? '✓' : '✗'} ${name} (${sec}초)${ok ? '' : ` — 로그: ${log}`}`);
  return ok;
}

const isWin = process.platform === 'win32';
const venvPy = isWin ? '.venv\\Scripts\\python' : '.venv/bin/python';
// 가상환경을 만들 파이썬 (CI는 3.12). 다른 파이썬을 쓰려면 PYTHON=경로
const python = process.env.PYTHON ?? 'python';

if (which === 'all' || which === 'checks') {
  await freshDb('codicomperchat_ci');
  const env = { DATABASE_URL: dbUrl('codicomperchat_ci') };
  step('패키지 설치 (npm ci)', 'npm ci', '.', env) &&
    step('Prisma 생성·마이그레이션', 'npx prisma generate && npx prisma migrate deploy', 'apps/api', env) &&
    step('린트 (oxlint --deny-warnings)', 'npx oxlint --deny-warnings apps/api/src apps/web/app apps/web/lib apps/web/components console/app console/lib console/components e2e', '.', env) &&
    step('타입 검사 (api)', 'npm run typecheck:api', '.', env) &&
    step('타입 검사 (web)', 'npx next typegen && npx tsc --noEmit', 'apps/web', env) &&
    step('타입 검사 (console)', 'npx next typegen && npx tsc --noEmit', 'console', env) &&
    step('API 단위 테스트', 'npm run test:api', '.', env);
  step('AI 서비스 불러오기', `"${python}" -m venv .venv && ${venvPy} -m pip install -q -r requirements.txt && ${venvPy} -m compileall -q app evals && ${venvPy} -c "import app.main"`, 'services/ai');
}

if (which === 'all' || which === 'e2e') {
  if (!existsSync(join(clone, 'node_modules'))) step('패키지 설치 (npm ci)', 'npm ci', '.');
  if (!existsSync(join(clone, 'services', 'ai', '.venv'))) {
    step('AI 서비스 가상환경', `"${python}" -m venv .venv && ${venvPy} -m pip install -q -r requirements.txt`, 'services/ai');
  }
  await freshDb('codicomperchat_ci_e2e');
  const e2e = dbUrl('codicomperchat_ci_e2e');
  step('Prisma 생성', 'npx prisma generate', 'apps/api', { DATABASE_URL: e2e });
  step('웹 화면 자동 테스트', 'npm run test:e2e', '.', { E2E_DATABASE_URL: e2e, DATABASE_URL: e2e });
}

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} 단계 통과`);
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
