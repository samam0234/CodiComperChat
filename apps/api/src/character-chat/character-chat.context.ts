import type { CharactersService } from '../characters/characters.service.js';
import type { RagContext } from '../persona-rag/persona-rag.service.js';
import type {
  ChatTurn,
  ContextSlicePayload,
  UserPersonaPayload,
} from './character-chat.types.js';

type PublicCharacter = Awaited<
  ReturnType<CharactersService['findOnePublished']>
>;

// 매 회차 새로 캠페인을 여는 게 아니라, 캐릭터 상세에서 바로 미리보기로 대화하는
// 자리다. 캠페인/세션/CampaignState가 아직 없으니 관계·훅은 항상 빈 값이고,
// retrievedMemories(과거 세션 장기 기억)도 비워 둔다 — 검색할 과거 세션이 아직 없다.
// 세션이 쌓이면(계획서 13.3장 "장기 기억 검색") 그때 채울 자리다.
//
// activeLore는 페르소나 지식 JSON에서 이번 대화와 관련된 조각만 골라 채운다(persona-rag).
// 지식 파일이 없는 캐릭터(rag === null)는 예전처럼 카드 원문 전부를 directorNote로 넘긴다.
export function buildContextSlice(
  character: PublicCharacter,
  history: ChatTurn[],
  persona: UserPersonaPayload | null = null,
  rag: RagContext | null = null,
): ContextSlicePayload {
  const honorific = character.speechStyle.includes('존댓말')
    ? 'jondae'
    : character.speechStyle.includes('반말')
      ? 'banmal'
      : 'mix';

  // 카드 원문 손실 없이 그대로 넘긴다 — 구조화된 필드(warmth 등)로 억지로
  // 쪼개는 대신, FastAPI 시스템 프롬프트가 이 블록을 그대로 붙인다.
  // 지식 JSON이 있으면 그 core(항상 들어갈 극소 핵심)만 넘기고 나머지는 검색으로 고른다.
  const directorNote = rag
    ? rag.core.map((line) => `- ${line}`).join('\n')
    : [
        `호칭: ${character.addressing}`,
        `성격 축: ${character.personalityAxes}`,
        `말투: ${character.speechStyle}`,
        `아는 것: ${character.knows}`,
        `모르는 것: ${character.unknown}`,
        `목표: ${character.goal}`,
        `갈등 씨앗: ${character.conflictSeed}`,
        `시작 장면(참고용): ${character.openingScene}`,
      ].join('\n');

  return {
    character: {
      name: character.name,
      role: character.role,
      // 카드에 수치화된 성격 축이 없어 중립값(50)으로 둔다. 실제 색깔은
      // directorNote의 personalityAxes 원문이 대신한다.
      warmth: 50,
      directness: 50,
      impulse: 50,
      protectiveness: 50,
      speech: {
        honorific,
        addressAs: character.addressing,
        forbidden: [],
        habits: [],
      },
      summary: character.oneLiner,
      neverDo: [],
      // secret 원문은 애초에 이 서버 프로세스로 들어오지 않는다
      // (CharactersService.PUBLIC_FIELDS가 select 단계에서 제외).
      // "비밀이 있다"는 사실만 일반화해 전달한다.
      lockedSecretTopics: ['아직 밝혀지지 않은 개인적인 사정'],
      unlockedSecrets: [],
    },
    state: { relations: [], openHooks: [], knowledge: [] },
    activeLore: rag?.lore ?? [],
    recentTurns: history,
    retrievedMemories: [],
    directorNote,
    userPersona: persona,
  };
}
