import { retrieve, type Query } from '../persona-rag/retriever.js';

const PINNED_CAP = 12;
const INCLUDE_ALL_UNDER = 8;
const RELEVANT_PICK = 4;
const RECENT_PICK = 3;
const CONTEXT_CAP = 24;
const VECTOR_PICK = 4;

export type MemoryRow = { id: string; content: string; pinned: boolean; createdAt: Date };

// 벡터 검색이 이번 말과 가까운 기억을 돌려주면 그 조각과 직접 적은 기억만 넣는다.
// 없으면 예전처럼 글자 검색이다. 둘 다 넣으면 프롬프트만 길어진다.
export function chooseMemories(
  all: MemoryRow[],
  query: Query,
  vectorTexts: string[] | null,
): { id: string; text: string }[] {
  const pinned = all.filter((memory) => memory.pinned).slice(0, PINNED_CAP);
  // 색인 갱신 중 삭제된 기억이 돌아올 수 있다. 현재 DB에 남아 있는 문장만 근거로 쓴다.
  const currentVectorTexts = vectorTexts?.filter((text) => all.some((memory) => memory.content === text)) ?? [];
  if (currentVectorTexts.length > 0) {
    const chosen = [...pinned];
    const seen = new Set(pinned.map((memory) => memory.content));
    for (const text of currentVectorTexts) {
      if (chosen.length >= PINNED_CAP + VECTOR_PICK) break;
      if (seen.has(text)) continue;
      seen.add(text);
      const found = all.find((memory) => memory.content === text);
      if (found) chosen.push(found);
    }
    return chosen.slice(-CONTEXT_CAP).map((memory) => ({ id: memory.id, text: memory.content }));
  }

  const chosen = new Set(pinned.map((memory) => memory.id));
  const rest = all.filter((memory) => !memory.pinned);
  if (rest.length <= INCLUDE_ALL_UNDER) {
    for (const memory of rest) chosen.add(memory.id);
  } else {
    const chunks = rest.map((memory) => ({
      id: memory.id,
      type: 'memory',
      topic: '',
      keywords: [],
      text: memory.content,
    }));
    for (const picked of retrieve(chunks, query, { topK: RELEVANT_PICK, charBudget: 600 })) {
      chosen.add(picked.chunk.id);
    }
    for (const memory of rest.slice(0, RECENT_PICK)) chosen.add(memory.id);
  }
  return all
    .filter((memory) => chosen.has(memory.id))
    .reverse()
    .slice(-CONTEXT_CAP)
    .map((memory) => ({ id: memory.id, text: memory.content }));
}
