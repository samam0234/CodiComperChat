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
  // 지금 대화가 없고 저장한 대화만 있으면 false
  active: boolean;
  savedCount: number;
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

export type ChatHistory = {
  started: boolean;
  // 이 대화에 고정된 내 프로필 (첫 메시지 뒤로는 새로하기 전까지 바꿀 수 없다)
  persona: { id: string; name: string } | null;
  savedCount: number;
  messages: HistoryMessage[];
};

// 이 캐릭터와의 지금 대화. 못 불러오면 null → 호출부가 시작 장면으로 대신한다
export async function getChatHistory(characterId: string): Promise<ChatHistory | null> {
  return authedGet<ChatHistory>(`/characters/${encodeURIComponent(characterId)}/chat`);
}

export type SavedConversation = {
  id: string;
  title: string;
  personaName: string | null;
  savedAt: string | null;
  updatedAt: string;
  messageCount: number;
  memoryCount: number;
  lastMessage: { role: "user" | "character"; text: string; speaker: string | null } | null;
};

export type SavedConversationsView = {
  character: { id: string; name: string };
  // 이어하기 전에 지금 대화를 저장할지 물을지
  currentHasMessages: boolean;
  saved: SavedConversation[];
};

export async function getSavedConversations(characterId: string): Promise<SavedConversationsView | null> {
  return authedGet<SavedConversationsView>(`/characters/${encodeURIComponent(characterId)}/chat/saved`);
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
