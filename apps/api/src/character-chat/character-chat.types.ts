export type ChatTurn = {
  role: 'user' | 'character';
  text: string;
};

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
};
