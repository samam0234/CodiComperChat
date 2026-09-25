import { Injectable } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';

export type AgentTurn = { role: 'user' | 'agent'; text: string };
export type AgentChatReply = { reply: string };

// 토큰·비용을 묶어 두려고 최근 대화만 넘긴다
const HISTORY_LIMIT = 20;
const TEXT_LIMIT = 4000;

export function sanitizeHistory(raw: unknown): AgentTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is AgentTurn =>
        typeof t === 'object' &&
        t !== null &&
        (t.role === 'user' || t.role === 'agent') &&
        typeof t.text === 'string' &&
        t.text.trim() !== '',
    )
    .slice(-HISTORY_LIMIT)
    .map((t) => ({ role: t.role, text: t.text.slice(0, TEXT_LIMIT) }));
}

@Injectable()
export class AgentChatService {
  send(message: string, history: AgentTurn[]): Promise<AgentChatReply> {
    return postToAi<AgentChatReply>('/assist', { message, history });
  }
}
