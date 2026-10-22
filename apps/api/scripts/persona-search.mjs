// 어떤 조각이 검색되는지 서버를 띄우지 않고 확인한다. 빌드가 필요하다(npm run build).
//   npm run persona:search --workspace api -- 유지성 "3년 전에 뭐 하셨어요?"
//   npm run persona:search --workspace api -- 유지성 "그건 왜요?" "직전 유저 말" "직전 캐릭터 말"
import 'reflect-metadata';

const [name, message, ...recent] = process.argv.slice(2);
if (!name) {
  console.error('사용법: persona:search <캐릭터 이름> "<질문>" ["<직전 대화>" ...]');
  process.exit(1);
}

let store;
let retriever;
try {
  ({ PersonaKnowledgeStore: store } = await import('../dist/persona-rag/persona-knowledge.store.js'));
  retriever = await import('../dist/persona-rag/retriever.js');
} catch {
  console.error('dist가 없다. 먼저 `npm run build --workspace api` 를 실행하세요.');
  process.exit(1);
}

const knowledgeStore = store.at(process.env.PERSONA_DATA_DIR ?? new URL('../data/personas', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const report = knowledgeStore.report();

console.log(`폴더: ${report.dir}`);
for (const file of report.loaded) console.log(`  로드   ${file.file} — ${file.character} (조각 ${file.chunks}개)`);
for (const file of report.invalid) console.log(`  오류   ${file.file}\n         ${file.error}`);

const knowledge = knowledgeStore.get(name);
if (!knowledge) {
  console.log(`\n'${name}' 지식이 없다 → 이 캐릭터는 카드 원문 전부를 넘기는 예전 방식으로 대화한다.`);
  process.exit(0);
}

console.log(`\n[core — 매 턴 항상 들어감]`);
for (const line of knowledge.core) console.log(`  - ${line}`);

if (message === undefined) process.exit(0);

const query = { message, recent };
const scored = retriever.scoreChunks(knowledge.chunks, query);
const picked = new Set(retriever.retrieve(knowledge.chunks, query).map((p) => p.chunk.id));

console.log(`\n[질문] ${message}${recent.length ? `\n[직전 대화] ${recent.join(' / ')}` : ''}`);
console.log(`\n[점수 — ✔ 는 모델에 실제로 들어가는 조각]`);
for (const { chunk, score } of scored.slice(0, 8)) {
  console.log(`  ${picked.has(chunk.id) ? '✔' : ' '} ${score.toFixed(2).padStart(6)}  ${chunk.id}  (${chunk.topic})`);
}
if (picked.size === 0) {
  console.log('\n→ 관련 조각 없음. 설정에 없는 화제로 보고 아무것도 넣지 않는다 (프롬프트의 "지어내지 않는다" 규칙이 작동).');
}
