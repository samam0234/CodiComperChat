// e2e 실행 전 한 번: e2e DB 만들기 → 마이그레이션 → 데이터 비우기 → 공식 캐릭터 심기 → API 검증용 빌드
// (서버를 띄우기 전에 끝나야 해서 Playwright 설정 밖의 별도 단계로 둔다. `npm run test:e2e`가 이어서 호출한다)
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { E2E_DB, E2E_DB_NAME_EXPORT, MAIL_DIR, NEXT_DIST_DIR, PERSONA_DIR, ROOT } from "./env.mjs";

const run = (cmd, args, cwd, env = {}) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, ...env }, shell: process.platform === "win32" });

// 1) 데이터베이스가 없으면 만든다 (같은 서버의 관리용 DB `postgres`로 접속)
{
  const admin = new URL(E2E_DB);
  admin.pathname = "/postgres";
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  const exists = await client.query("select 1 from pg_database where datname = $1", [E2E_DB_NAME_EXPORT]);
  if (exists.rowCount === 0) {
    await client.query(`create database ${E2E_DB_NAME_EXPORT}`);
    console.log(`e2e: 데이터베이스 ${E2E_DB_NAME_EXPORT}를 만들었다`);
  }
  await client.end();
}

// 2) 마이그레이션을 적용한다 (개발 DB가 아니라 e2e DB에)
run("npx", ["prisma", "migrate", "deploy"], join(ROOT, "apps", "api"), { DATABASE_URL: E2E_DB });

// 3) 지난 실행의 데이터를 비우고 공식 캐릭터 하나를 심는다
{
  const client = new pg.Client({ connectionString: E2E_DB });
  await client.connect();
  const tables = (await client.query("select tablename from pg_tables where schemaname = 'public' and tablename <> '_prisma_migrations'")).rows.map((r) => `"${r.tablename}"`);
  await client.query(`truncate ${tables.join(", ")} restart identity cascade`);
  await client.query(
    `insert into characters (id, name, "oneLiner", role, addressing, "personalityAxes", "speechStyle", knows, unknown, goal, "conflictSeed", secret, "secretUnlockCondition", "openingScene", published, "updatedAt")
     values ('e2e-official', '테스트 선생', '시험용 공식 캐릭터', 'guide', '유저를 학생이라 부른다', '다정하고 차분함', '존댓말 기본', '유저의 진도', '유저의 사정', '진도 맞추기', '시험 일정', '비밀', '조건', '조용한 스터디카페. 선생이 문제집을 펴 두고 기다린다.', true, now())`,
  );
  // 비밀 퀘스트 시험용 공식 캐릭터 (친밀도 40 이상에서 부탁을 건넨다)
  await client.query(
    `insert into characters (id, name, "oneLiner", role, addressing, "personalityAxes", "speechStyle", knows, unknown, goal, "conflictSeed", secret, "secretUnlockCondition", "openingScene", published, quest, "updatedAt")
     values ('e2e-quest', '퀘스트 선생', '비밀 퀘스트 시험용 공식 캐릭터', 'guide', '유저를 학생이라 부른다', '다정하고 차분함', '존댓말 기본', '유저의 진도', '유저의 사정', '진도 맞추기', '시험 일정', '비밀', '조건', '조용한 스터디카페. 선생이 문제집을 펴 두고 기다린다.', true, $1::jsonb, now())`,
    [JSON.stringify({ title: '접어 둔 문제집', offer: '오래 접어 둔 문제집을 같이 풀어 봐 달라고 어렵게 부탁한다', objective: '유저가 그 문제집을 같이 풀어 보겠다고 말한다', reward: '선생이 처음으로 자기 얘기를 한다', unlockAt: 40 })],
  );
  // 추천 프로필이 있는 공식 캐릭터 (대화 화면에서 그대로 쓰거나 고쳐서 내 프로필로)
  await client.query(
    `insert into characters (id, name, "oneLiner", role, addressing, "personalityAxes", "speechStyle", knows, unknown, goal, "conflictSeed", secret, "secretUnlockCondition", "openingScene", published, "recommendedPersona", "updatedAt")
     values ('e2e-rec', '추천 비서', '추천 프로필 시험용 공식 캐릭터', 'companion', '유저를 회장님이라 부른다', '차갑지만 다정함', '존댓말 기본', '회장의 일정', '회장의 속마음', '회장을 지키기', '이사회 견제', '비밀', '조건', '@: 회장실. 비서가 서류를 들고 들어온다.

"회장님, 보고서입니다."', true, $1::jsonb, now())`,
    [JSON.stringify({ name: '서도현', description: '대기업의 회장. 30대 후반.' })],
  );
  await client.end();
}

// 4) 지식 파일 폴더·이전 e2e 빌드 비우기, API 검증용 빌드(dist-verify는 개발용 dist와 따로다)
// e2e 전용 tsconfig (Next가 이 파일을 고쳐 쓰므로 매번 새로 만들고 git에는 올리지 않는다)
for (const app of [join(ROOT, "apps", "web"), join(ROOT, "console")]) {
  writeFileSync(join(app, "tsconfig.e2e.json"), JSON.stringify({ extends: "./tsconfig.json" }, null, 2));
}
rmSync(PERSONA_DIR, { recursive: true, force: true });
rmSync(MAIL_DIR, { recursive: true, force: true });
rmSync(join(ROOT, "apps", "web", NEXT_DIST_DIR), { recursive: true, force: true });
rmSync(join(ROOT, "console", NEXT_DIST_DIR), { recursive: true, force: true });
run("npm", ["run", "build:verify", "--workspace", "api", "--silent"], ROOT);
console.log("e2e: 준비 끝");
