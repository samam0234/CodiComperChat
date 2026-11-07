import { GatewayTimeoutException, HttpException, ServiceUnavailableException } from '@nestjs/common';
import http from 'node:http';
import https from 'node:https';
import { type Priority, aiQueue } from './ai-queue.js';

// FastAPI(services/ai)는 Nest만 호출한다 (기획서 §7.1). 호출과 오류 변환을 한곳에 둔다

// 모델이 멎었을 때 요청이 영영 매달려 있지 않게 한다. 느린 서버(CPU·큰 모델 gemma4:12b)를 감안해 환경변수로 늘릴 수 있다.
//  - foreground: 사용자가 화면에서 기다리는 답. 웹(Vercel 함수 300초)보다 조금 짧게 둬서 웹이 먼저 끊기지 않게 한다
//  - background: 뒤에서 하는 정리(기억·이야기 요약). 기다리는 사람이 없으니 길게 둔다
const DEFAULT_TIMEOUT_MS = { foreground: 280_000, background: 600_000 } as const;
const TIMEOUT_ENV = { foreground: 'AI_TIMEOUT_MS', background: 'AI_BACKGROUND_TIMEOUT_MS' } as const;

export function timeoutFromEnv(priority: Priority): number {
  const n = Number(process.env[TIMEOUT_ENV[priority]]);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS[priority];
}

export type AiCallOptions = {
  // foreground: 사용자가 지금 기다리는 답(기본). background: 뒤에서 하는 정리(기억·이야기 요약) — 기다리는 답에 양보한다
  priority?: Priority;
  // 이 호출만 더 기다릴 때 (코디포토넷: 그림 모델을 바꾸면 처음 한 번 읽는 데 몇 분 걸린다)
  timeoutMs?: number;
};

export async function postToAi<T>(path: string, payload: unknown, options: AiCallOptions = {}): Promise<T> {
  const priority = options.priority ?? 'foreground';
  // 대기열에 자리가 날 때까지 기다린 뒤 보낸다 (모델 앞에 줄이 길어지는 것을 막는다)
  return aiQueue.run(priority, () => send<T>(path, payload, options.timeoutMs ?? timeoutFromEnv(priority)));
}

// 대기열을 거치지 않는 짧은 조회 (상태 확인처럼 모델을 부르지 않는 것). 실패하면 예외
function aiHeaders(json: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = process.env.AI_SERVICE_TOKEN;
  if (token) headers['X-AI-Token'] = token;
  return headers;
}

export async function getFromAi<T>(path: string, timeoutMs: number): Promise<T> {
  const aiBaseUrl = process.env.AI_BASE_URL ?? 'http://localhost:8000';
  const res = await fetch(`${aiBaseUrl}${path}`, { headers: aiHeaders(false), signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new HttpException('AI 서비스 조회가 실패했다', res.status);
  return (await res.json()) as T;
}

type RawResponse = { status: number; body: string };

// 전역 fetch(undici)는 timeoutMs와 상관없이 응답 헤더를 300초 넘게 기다리지 않는다(headersTimeout).
// FastAPI는 답을 다 만든 뒤에야 헤더를 보내므로, 느린 모델의 긴 답이 300초에서 잘리지 않도록 node:http로 보낸다
export function rawPost(url: string, headers: Record<string, string>, body: string, timeoutMs: number): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === 'https:' ? https : http;
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const req = client.request(
      target,
      { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => finish(() => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') })));
        res.on('error', (e) => finish(() => reject(e)));
      },
    );
    const timer = setTimeout(() => {
      const err = new Error('AI 응답 시간 초과');
      err.name = 'TimeoutError';
      req.destroy(err);
      finish(() => reject(err));
    }, timeoutMs);
    req.on('error', (e) => finish(() => reject(e)));
    req.end(body);
  });
}

async function send<T>(path: string, payload: unknown, timeoutMs: number): Promise<T> {
  const aiBaseUrl = process.env.AI_BASE_URL ?? 'http://localhost:8000';

  let res: RawResponse;
  try {
    res = await rawPost(`${aiBaseUrl}${path}`, aiHeaders(true), JSON.stringify(payload), timeoutMs);
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new GatewayTimeoutException('AI 응답이 너무 늦어 멈췄어요. 잠시 뒤에 다시 시도해 주세요.');
    }
    throw new ServiceUnavailableException(
      `${aiBaseUrl}에 연결할 수 없습니다. services/ai가 켜져 있는지 확인하세요.`,
    );
  }

  let data: { detail?: unknown } | null = null;
  try {
    data = JSON.parse(res.body) as { detail?: unknown };
  } catch {
    data = null;
  }
  if (res.status < 200 || res.status >= 300) {
    // FastAPI 검증 오류(422)의 detail은 배열이라 문자열일 때만 그대로 쓴다
    const detail = typeof data?.detail === 'string' ? data.detail : 'AI 요청이 실패했다';
    throw new HttpException(detail, res.status);
  }
  return data as T;
}
