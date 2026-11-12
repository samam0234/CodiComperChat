import type { PersonaChunk } from './persona-knowledge.types.js';

// 한국어 검색: 형태소 분석기 없이 글자 2-gram으로 비교한다. 조사가 붙어도("진로를" ↔ "진로")
// 겹치는 글자쌍이 남고, 사전 관리가 필요 없다. 문서가 수십 개 규모라 이 정도로 충분하다.
// 임베딩 검색은 같은 인터페이스(질의 → 점수 매긴 조각)로 나중에 바꿔 끼울 수 있다.

const BIGRAM_WEIGHT = 1;
// 한 글자짜리 말(키·눈·집·말)은 2-gram이 안 생겨서 첫 글자만 따로 약하게 본다
const STEM_WEIGHT = 0.35;

const RUN = /[가-힣a-z0-9]+/g;

// 어디에나 나오는 말(시간어·부사·어미·의문사)의 글자쌍은 화제를 가리지 못한다.
// 문서가 수십 개뿐이라 이런 말이 우연히 한 조각에만 있으면 오히려 높은 점수로 튀므로 질의에서 뺀다
const STOP_BIGRAMS = new Set([
  '오늘', '지금', '그냥', '진짜', '정말', '너무', '이제', '우리', '제가', '저는', '나는',
  '어떻', '떻게', '이렇', '그렇', '저렇', '어때', '때요', '뭐가', '무슨', '어디', '언제', '누가',
  '하는', '있는', '없는', '되는', '하고', '해요', '했어', '했던', '하던', '이에', '에요', '네요',
  '어요', '아요', '습니', '니다', '합니', '세요', '까요', '나요', '는데', '인데', '거든', '잖아',
  '그건', '이건', '저건', '그게', '이게', '그런', '이런', '저런', '그리', '그래', '으로', '에서',
  '에게', '한테', '이랑', '부터', '까지', '보다', '처럼', '만큼',
]);

export function tokenize(text: string, dropStop = false): Map<string, number> {
  const tokens = new Map<string, number>();
  const add = (token: string, weight: number) => {
    tokens.set(token, (tokens.get(token) ?? 0) + weight);
  };

  for (const run of text.normalize('NFC').toLowerCase().match(RUN) ?? []) {
    for (let i = 0; i + 1 < run.length; i++) {
      const bigram = run.slice(i, i + 2);
      if (!(dropStop && STOP_BIGRAMS.has(bigram))) add(bigram, BIGRAM_WEIGHT);
    }
    // 조사가 어미에 붙는 한국어에서 낱말의 첫 글자는 어간이다
    add(run[0], STEM_WEIGHT);
  }
  return tokens;
}

export type Query = {
  // 이번에 유저가 보낸 말
  message: string;
  // 바로 앞 대화(오래된 것부터). "그건 왜요?" 같은 후속 질문이 앞 맥락으로 검색되게 한다
  recent: string[];
};

export type Scored = { chunk: PersonaChunk; score: number };

export type RetrieveOptions = {
  topK?: number;
  // 최고점 대비 이 비율보다 낮은 조각은 버린다 (자료가 없는 화제에서 억지로 채우지 않기 위해)
  relativeCutoff?: number;
  // 절대 하한. 우연히 글자쌍 하나 겹친 정도는 검색 결과로 치지 않는다
  minScore?: number;
  // 고른 조각들 본문 글자 수 합계 상한 (기획서 13.3 컨텍스트 예산: 최근 턴이 우선이다)
  charBudget?: number;
};

const DEFAULTS: Required<RetrieveOptions> = {
  topK: 3,
  relativeCutoff: 0.4,
  minScore: 1.2,
  charBudget: 700,
};

// 직전 대화가 이번 말보다 검색을 좌우하지 않게 가중치를 낮춘다
const RECENT_WEIGHTS = [0.3, 0.45];
const KEYWORD_BONUS = 2.5;
const KEYWORD_BONUS_CAP = 3;
const RECENT_KEYWORD_RATIO = 0.3;

const K1 = 1.2;
const B = 0.75;

type Doc = { chunk: PersonaChunk; tf: Map<string, number>; length: number };

function toDoc(chunk: PersonaChunk): Doc {
  const tf = new Map<string, number>();
  // 제목과 키워드는 작성자가 "이 조각의 주제"라고 표시한 곳이라 본문보다 무겁게 본다
  const parts: [string, number][] = [
    [chunk.text, 1],
    [chunk.topic, 2],
    [chunk.keywords.join(' '), 3],
  ];
  for (const [text, weight] of parts) {
    for (const [token, count] of tokenize(text)) {
      tf.set(token, (tf.get(token) ?? 0) + count * weight);
    }
  }
  let length = 0;
  for (const count of tf.values()) length += count;
  return { chunk, tf, length };
}

function buildQuery(query: Query): Map<string, number> {
  const weighted = new Map<string, number>();
  const merge = (text: string, weight: number) => {
    for (const [token, count] of tokenize(text, true)) {
      weighted.set(token, (weighted.get(token) ?? 0) + count * weight);
    }
  };
  merge(query.message, 1);
  const recent = query.recent.slice(-RECENT_WEIGHTS.length);
  // 가장 최근 것이 가장 무겁다
  recent.forEach((text, i) => merge(text, RECENT_WEIGHTS[RECENT_WEIGHTS.length - recent.length + i]));
  return weighted;
}

// 모든 조각의 점수를 높은 순으로 돌려준다. 무엇이 왜 골라졌는지 볼 때(persona:search)도 쓴다
export function scoreChunks(chunks: PersonaChunk[], query: Query): Scored[] {
  if (chunks.length === 0) return [];

  const docs = chunks.map(toDoc);
  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / docs.length || 1;

  const documentFrequency = new Map<string, number>();
  for (const doc of docs) {
    for (const token of doc.tf.keys()) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  const idf = (token: string) => {
    const df = documentFrequency.get(token) ?? 0;
    return Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
  };

  const weightedQuery = buildQuery(query);
  const inMessage = query.message.normalize('NFC').toLowerCase();
  const inRecent = query.recent.slice(-RECENT_WEIGHTS.length).join(' ').normalize('NFC').toLowerCase();

  const scored: Scored[] = docs.map((doc) => {
    let score = 0;
    for (const [token, qWeight] of weightedQuery) {
      const tf = doc.tf.get(token);
      if (!tf) continue;
      const saturation = (tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * doc.length) / avgLength));
      score += qWeight * idf(token) * saturation;
    }

    // 작성자가 적어 둔 키워드가 질문에 그대로 들어 있으면 조사가 붙어 있어도("진로를") 잡는다.
    // 이번 말에서 맞은 것이 주력이고, 직전 대화에서만 맞은 것은 약하게 본다
    let hitsNow = 0;
    let hitsBefore = 0;
    for (const keyword of doc.chunk.keywords) {
      const key = keyword.normalize('NFC').toLowerCase();
      if (inMessage.includes(key)) hitsNow++;
      else if (inRecent.includes(key)) hitsBefore++;
    }
    score +=
      Math.min(hitsNow, KEYWORD_BONUS_CAP) * KEYWORD_BONUS +
      Math.min(hitsBefore, KEYWORD_BONUS_CAP) * KEYWORD_BONUS * RECENT_KEYWORD_RATIO;

    return { chunk: doc.chunk, score };
  });

  return scored.sort((a, b) => b.score - a.score);
}

export function retrieve(
  chunks: PersonaChunk[],
  query: Query,
  options: RetrieveOptions = {},
): Scored[] {
  const opt = { ...DEFAULTS, ...options };
  const scored = scoreChunks(chunks, query);
  const best = scored[0]?.score ?? 0;
  if (best < opt.minScore) return [];

  const picked: Scored[] = [];
  let used = 0;
  for (const item of scored) {
    if (picked.length >= opt.topK) break;
    if (item.score < opt.minScore || item.score < best * opt.relativeCutoff) break;
    if (picked.length > 0 && used + item.chunk.text.length > opt.charBudget) continue;
    picked.push(item);
    used += item.chunk.text.length;
  }
  return picked;
}
