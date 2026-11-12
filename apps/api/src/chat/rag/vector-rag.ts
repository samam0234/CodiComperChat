import { aiHeaders } from '../ai/ai-client.js';

const TIMEOUT_MS = 800;

export type VectorHit = { personal: string[]; common: string[] };

function aiBase(): string {
  return process.env.AI_BASE_URL ?? 'http://localhost:8000';
}

async function post(path: string, payload: unknown): Promise<Response> {
  return fetch(`${aiBase()}${path}`, {
    method: 'POST',
    headers: aiHeaders(true),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

// 실패하면 null. 대화는 글자 검색으로 이어 간다. 대기열을 잡지 않는다.
export async function searchVectors(userId: string, characterId: string, text: string): Promise<VectorHit | null> {
  const query = text.trim();
  if (!query) return { personal: [], common: [] };
  try {
    const res = await post('/rag/query', { userId, characterId, text: query });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<VectorHit>;
    return {
      personal: Array.isArray(body.personal) ? body.personal.filter((line) => typeof line === 'string') : [],
      common: Array.isArray(body.common) ? body.common.filter((line) => typeof line === 'string') : [],
    };
  } catch {
    return null;
  }
}

export async function replacePersonalVectors(
  userId: string,
  characterId: string,
  items: { id: string; text: string }[],
): Promise<void> {
  try {
    await post('/rag/personal', { userId, characterId, items });
  } catch {
    // 저장 실패가 대화를 막지 않는다
  }
}
