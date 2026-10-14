// 서버 DB의 공개 카드 필드로 페르소나 지식 JSON의 "시작 파일"을 만든다.
// 비밀(secret)·해금 조건은 조회 대상에서 아예 뺀다 — 이 파일은 나중에 손으로 고치는 설정 원본이다.
//   npm run persona:build --workspace api               없는 캐릭터만 만든다
//   npm run persona:build --workspace api -- --force    이미 있는 파일도 덮어쓴다
//   npm run persona:build --workspace api -- --name 유지성
import 'dotenv/config';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const args = process.argv.slice(2);
const force = args.includes('--force');
const nameIndex = args.indexOf('--name');
const onlyName = nameIndex >= 0 ? args[nameIndex + 1] : null;

const dir = process.env.PERSONA_DATA_DIR ?? fileURLToPath(new URL('../data/personas', import.meta.url));

// 검색 단위를 작게 유지한다. 문장 경계(. ! ?)에서 잘라 180자 안팎으로 묶는다
function split(text, limit = 180) {
  const sentences = text.split(/(?<=[.!?。])\s+/).filter(Boolean);
  const parts = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > limit) {
      parts.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function chunksFor({ id, type, topic, keywords = [], text }) {
  return split(text).map((part, i) => ({
    id: i === 0 ? id : `${id}-${i + 1}`,
    type,
    topic,
    keywords,
    text: part,
  }));
}

function profileText(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const labels = { age: ['나이', '세'], gender: ['성별', ''], heightCm: ['키', 'cm'], weightKg: ['몸무게', 'kg'], occupation: ['직업', ''] };
  const parts = Object.entries(labels)
    .filter(([key]) => profile[key] !== undefined && profile[key] !== null && profile[key] !== '')
    .map(([key, [label, suffix]]) => `${label} ${profile[key]}${suffix}`);
  return parts.length ? parts.join(', ') : null;
}

function build(c) {
  const core = [
    `${c.name}: ${c.oneLiner}`,
    `호칭: ${c.addressing}`,
    `성격: ${c.personalityAxes}`,
    `말투: ${c.speechStyle}`,
    '금기: 자기가 AI라거나 설정이 있다는 말을 하지 않는다. 설정에 없는 개인사는 지어내지 않고 캐릭터답게 넘기거나 되묻는다',
  ];

  const chunks = [
    ...chunksFor({ id: 'card-knows', type: 'knowledge', topic: '캐릭터가 아는 것', text: `캐릭터가 아는 것: ${c.knows}` }),
    // 카드의 '모르는 것'은 캐릭터 본인이 모르는 사실이다. 앞에 표시를 붙여 모델이 캐릭터가 아는 것처럼 말하지 않게 한다
    ...chunksFor({ id: 'card-unknown', type: 'boundary', topic: '캐릭터가 아직 모르는 것', text: `캐릭터 본인은 아직 모르고 스스로 꺼내지도 않는다: ${c.unknown}` }),
    ...chunksFor({ id: 'card-goal', type: 'motivation', topic: '목표와 속마음', text: c.goal }),
    ...chunksFor({ id: 'card-conflict', type: 'conflict', topic: '갈등의 씨앗', text: c.conflictSeed }),
    ...chunksFor({ id: 'card-opening', type: 'world', topic: '첫 만남 장면', keywords: ['처음', '첫날', '첫 만남'], text: c.openingScene }),
  ];

  const profile = profileText(c.profile);
  if (profile) {
    chunks.push({
      id: 'card-profile',
      type: 'profile',
      topic: '기본 프로필',
      keywords: ['나이', '몇 살', '키', '몸무게', '직업', '성별', '뭐 하는'],
      text: profile,
    });
  }

  // 작은 모델이 카드에 없는 개인사를 술술 지어내는 것을 막는 안전장치. 가족·고향 같은 질문이 오면 이 조각이 검색된다.
  // '없다/있다'로 단정하는 것도 지어내기라서("형제는 없어요", "이 근처예요") 그것까지 막는다
  chunks.push({
    id: 'guard-unwritten',
    type: 'boundary',
    topic: '설정에 없는 개인사',
    keywords: [
      '가족', '부모', '엄마', '아빠', '형제', '자매', '동생', '누나', '오빠', '언니', '형',
      '고향', '출신', '어디 살', '사는 곳', '어린 시절', '학교', '대학', '전공', '졸업',
      '연애', '여자친구', '남자친구', '친구', '취미',
    ],
    text: '가족·형제·고향·출신·학교·전공·어린 시절·연애·취미 같은 세부 사정은 설정에 적혀 있지 않다. 있다/없다, 어디다, 무엇이다로 단정하지 않는다("형제는 없어요", "고향은 이 근처예요" 금지). 캐릭터답게 "그건 다음에 얘기해요"처럼 말을 돌리거나 되묻는다.',
  });

  return { schemaVersion: 1, character: c.name, core, chunks };
}

// 빌드된 검증기가 있으면 쓴다. 없으면(아직 npm run build 전) 건너뛰고 알린다
async function loadValidator() {
  try {
    const mod = await import('../dist/persona-rag/persona-knowledge.types.js');
    return mod.parsePersonaKnowledge;
  } catch {
    console.warn('(참고) dist가 없어 형식 검증을 건너뛴다 — npm run build 후 persona:search 로 확인하세요');
    return null;
  }
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  const characters = await prisma.character.findMany({
    // 공방에서 발행한 캐릭터는 발행할 때 카드 전체로 studio-<초안 id>.json 을 쓴다 — 두 번째 파일을 만들지 않는다
    where: { published: true, draft: null, ...(onlyName ? { name: onlyName } : {}) },
    // secret · secretUnlockCondition 은 일부러 고르지 않는다
    select: {
      name: true,
      oneLiner: true,
      addressing: true,
      personalityAxes: true,
      speechStyle: true,
      knows: true,
      unknown: true,
      goal: true,
      conflictSeed: true,
      openingScene: true,
      profile: true,
    },
  });

  if (characters.length === 0) {
    console.log(onlyName ? `'${onlyName}' 캐릭터를 찾을 수 없다` : '발행된 캐릭터가 없다');
  }

  mkdirSync(dir, { recursive: true });
  const validate = await loadValidator();

  for (const character of characters) {
    const file = join(dir, `${character.name}.json`);
    if (existsSync(file) && !force) {
      console.log(`건너뜀  ${character.name}.json (이미 있다. 덮어쓰려면 --force)`);
      continue;
    }
    const knowledge = build(character);
    validate?.(knowledge, `${character.name}.json`);
    writeFileSync(file, JSON.stringify(knowledge, null, 2) + '\n', 'utf8');
    console.log(`만듦    ${character.name}.json — core ${knowledge.core.length}줄, 조각 ${knowledge.chunks.length}개`);
  }
  console.log(`\n폴더: ${dir}\n이 파일을 열어 배경·관계·습관·말투 예시를 채우세요. (git에는 올라가지 않는다)`);
} finally {
  await prisma.$disconnect();
}
