export type ChatTurn = {
  role: 'user' | 'character';
  text: string;
};

export type UserPersonaPayload = { name: string; description: string };

// services/ai/app/schemas/context.py의 ContextSlice와 필드가 1:1로 대응해야 한다.
// (WireModel의 alias_generator=to_camel이 snake_case -> camelCase로 바꾼 이름 기준)
export type ContextSlicePayload = {
  character: {
    name: string;
    role: string;
    warmth: number;
    directness: number;
    impulse: number;
    protectiveness: number;
    speech: {
      honorific: 'banmal' | 'jondae' | 'mix';
      addressAs: string;
      forbidden: string[];
      habits: string[];
    };
    summary: string;
    neverDo: string[];
    lockedSecretTopics: string[];
    unlockedSecrets: string[];
  };
  state: {
    relations: { name: string; value: number; reason: string }[];
    openHooks: { id: string; text: string }[];
    knowledge: string[];
  };
  activeLore: { keyword: string; content: string }[];
  recentTurns: ChatTurn[];
  retrievedMemories: { id: string; text: string }[];
  directorNote: string | null;
  userPersona: UserPersonaPayload | null;
  // 유저가 캐릭터 상태설정에서 정한 호칭. 있으면 카드의 호칭 규칙보다 우선한다
  addressOverride: string | null;
  // 이번 턴 등장 조건에 맞은 엑스트라(유저가 만든 조연)만. 조건에 안 맞으면 아예 안 보낸다
  extras: ExtraPayload[];
};

export type ExtraPayload = {
  name: string;
  summary: string;
  personality: string;
  relation: string;
  situation: string;
  place: string;
  // 이번 턴에 등장하는 이유 (모델이 억지로 끌어들이지 않고 맥락에 맞게 쓰도록)
  reason: string;
  // 등장 방식을 정하는 신호: 이름 언급 / 인물 관계 / 상황 / 장소 / 방금 등장해 있음
  cue: 'name' | 'relation' | 'situation' | 'place' | 'continuity';
};
