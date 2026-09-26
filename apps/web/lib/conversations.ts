import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";

export type HistoryMessage = {
  id: string;
  role: "user" | "character";
  text: string;
  speaker: string | null;
};

export type ConversationSummary = {
  id: string;
  character: { id: string; name: string; oneLiner: string };
  messageCount: number;
  updatedAt: string;
  lastMessage: { role: "user" | "character"; text: string; speaker: string | null; createdAt: string } | null;
};

async function authedGet<T>(path: string): Promise<T | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// 이 캐릭터와 저장된 대화. 못 불러오면 null → 호출부가 시작 장면으로 대신한다
export async function getChatHistory(characterId: string): Promise<HistoryMessage[] | null> {
  const data = await authedGet<{ messages: HistoryMessage[] }>(
    `/characters/${encodeURIComponent(characterId)}/chat`,
  );
  return data?.messages ?? null;
}

export async function getMyConversations(): Promise<ConversationSummary[] | null> {
  return authedGet<ConversationSummary[]>("/me/conversations");
}

export type MemoriesView = {
  character: { id: string; name: string };
  started: boolean;
  memories: { id: string; content: string; createdAt: string }[];
};

export async function getMemories(characterId: string): Promise<MemoriesView | null> {
  return authedGet<MemoriesView>(`/characters/${encodeURIComponent(characterId)}/chat/memories`);
}

export type ChatStateView = {
  character: { id: string; name: string; addressing: string };
  state: {
    relationshipValue: number;
    relationshipNote: string | null;
    userNickname: string | null;
    relationshipLabel: string;
  };
};

export async function getChatState(characterId: string): Promise<ChatStateView | null> {
  return authedGet<ChatStateView>(`/characters/${encodeURIComponent(characterId)}/chat/state`);
}
