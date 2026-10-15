import type { CharactersService } from '../characters/characters.service.js';
import { type ChatState, relationshipLabel } from '../chat-state/chat-state.service.js';
import type { RagContext } from '../persona-rag/persona-rag.service.js';
import type {
  ChatTurn,
  ContextSlicePayload,
  ExtraPayload,
  UserPersonaPayload,
} from './character-chat.types.js';

type PublicCharacter = Awaited<
  ReturnType<CharactersService['findOnePublished']>
>;

// 대화는 캐릭터마다 하나(Campaign)로 이어진다. recentTurns는 서버에 저장된 최근 턴이고,
// retrievedMemories는 지난 대화에서 정리해 둔 기억(MemoryChunk) 중 이번 턴에 고른 것이다
// (계획서 13.3장 "장기 기억 검색"). 훅은 아직 빈 값이다.
//
// activeLore는 페르소나 지식 JSON에서 이번 대화와 관련된 조각만 골라 채운다(persona-rag).
// 지식 파일이 없는 캐릭터(rag === null)는 예전처럼 카드 원문 전부를 directorNote로 넘긴다.
export function buildContextSlice(
  character: PublicCharacter,
  history: ChatTurn[],
  persona: UserPersonaPayload | null = null,
  rag: RagContext | null = null,
  // 지난 대화에서 정리해 둔 기억(MemoryChunk) 중 이번 턴에 고른 것
  memories: { id: string; text: string }[] = [],
  // 캐릭터 상태설정(친밀도·관계 메모·호칭). 대화 전이면 null
  chatState: ChatState | null = null,
  // 이번 턴 등장 조건에 맞은 엑스트라
  extras: ExtraPayload[] = [],
  // 이번 말이 건드렸지만 설정에 근거가 없는 개인사 주제
  ungrounded: string[] = [],
): ContextSlicePayload {
  const nickname = chatState?.userNickname ?? null;
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
        addressAs: nickname ?? character.addressing,
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
    state: {
      // 숫자만으론 모델이 의미를 모르니 구간 이름과 유저가 쓴 메모를 근거로 함께 넘긴다 (기획서 4.2장)
      relations: chatState
        ? [
            {
              name: '친밀도(0 처음 만남 ~ 100 각별함)',
              value: chatState.relationshipValue,
              reason: [relationshipLabel(chatState.relationshipValue), chatState.relationshipNote]
                .filter(Boolean)
                .join(' — '),
            },
          ]
        : [],
      openHooks: [],
      knowledge: [],
    },
    activeLore: rag?.lore ?? [],
    recentTurns: history,
    retrievedMemories: memories,
    directorNote,
    userPersona: persona,
    addressOverride: nickname,
    extras,
    ungroundedTopics: ungrounded,
  };
}
