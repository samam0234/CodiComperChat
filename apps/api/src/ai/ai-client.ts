import { GatewayTimeoutException, HttpException, ServiceUnavailableException } from '@nestjs/common';
import { type Priority, aiQueue } from './ai-queue.js';

// FastAPI(services/ai)는 Nest만 내부망에서 호출한다 (기획서 §7.1). 호출과 오류 변환을 한곳에 둔다

// 모델이 멎었을 때 요청이 영영 매달려 있지 않게 한다. 느린 모델의 긴 답을 감안해 넉넉히 둔다
const TIMEOUT_MS = { foreground: 130_000, background: 150_000 } as const;

export type AiCallOptions = {
  // foreground: 사용자가 지금 기다리는 답(기본). background: 뒤에서 하는 정리(기억·이야기 요약) — 기다리는 답에 양보한다
  priority?: Priority;
};

export async function postToAi<T>(path: string, payload: unknown, options: AiCallOptions = {}): Promise<T> {
  const priority = options.priority ?? 'foreground';
  // 대기열에 자리가 날 때까지 기다린 뒤 보낸다 (모델 앞에 줄이 길어지는 것을 막는다)
  return aiQueue.run(priority, () => send<T>(path, payload, TIMEOUT_MS[priority]));
}

async function send<T>(path: string, payload: unknown, timeoutMs: number): Promise<T> {
  const aiBaseUrl = process.env.AI_BASE_URL ?? 'http://localhost:8000';

  let res: Response;
  try {
    res = await fetch(`${aiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new GatewayTimeoutException('AI 응답이 너무 늦어 멈췄어요. 잠시 뒤에 다시 시도해 주세요.');
    }
    throw new ServiceUnavailableException(
      `${aiBaseUrl}에 연결할 수 없습니다. services/ai가 켜져 있는지 확인하세요.`,
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // FastAPI 검증 오류(422)의 detail은 배열이라 문자열일 때만 그대로 쓴다
    const detail = typeof data?.detail === 'string' ? data.detail : 'AI 요청이 실패했다';
    throw new HttpException(detail, res.status);
  }
  return data as T;
}
