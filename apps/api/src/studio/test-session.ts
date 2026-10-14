import type { ChatTurn } from '../character-chat/character-chat.types.js';
import { cardHash, type Card } from './card.js';

// 기획서 §5.4·§6.1 "테스트 3턴"
export const TEST_TURNS = 3;

export type Verdict = {
  passed: boolean;
  toneBroken: boolean;
  overExplaining: boolean;
  metaLeak: boolean;
  secretLeak: boolean;
  // 설정 자료에 없는 자기 개인사를 단정했다 (페르소나 RAG로 막으려는 환각을 발행 전에 한 번 더 잡는다)
  inventedFacts: boolean;
  notes: string[];
  at: string;
};

// 서버가 들고 있는 테스트 대화. cardHash가 지금 카드와 다르면 무효(카드를 고친 뒤)
export type TestSession = { cardHash: string; turns: ChatTurn[]; verdict: Verdict | null };

export const userTurns = (turns: ChatTurn[]) => turns.filter((t) => t.role === 'user').length;

export function asSession(raw: unknown): TestSession | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Partial<TestSession>;
  return typeof s.cardHash === 'string' && Array.isArray(s.turns)
    ? { cardHash: s.cardHash, turns: s.turns, verdict: s.verdict ?? null }
    : null;
}

// 화면과 발행 가드가 읽는 테스트 상태: 지금 카드로 3턴을 마치고 통과했는가
export function testState(card: Card, raw: unknown) {
  const saved = asSession(raw);
  const fresh = saved !== null && saved.cardHash === cardHash(card);
  return {
    turns: fresh ? saved.turns : [],
    turnsUsed: fresh ? userTurns(saved.turns) : 0,
    turnsTotal: TEST_TURNS,
    verdict: fresh ? saved.verdict : null,
    passed: fresh && saved.verdict?.passed === true,
    // 카드를 고쳐서 예전 테스트가 무효가 됐는지 (화면 안내용)
    stale: saved !== null && !fresh,
  };
}
