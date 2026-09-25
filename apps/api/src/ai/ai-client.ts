import { HttpException, ServiceUnavailableException } from '@nestjs/common';

// FastAPI(services/ai)는 Nest만 내부망에서 호출한다 (기획서 §7.1). 호출과 오류 변환을 한곳에 둔다
export async function postToAi<T>(path: string, payload: unknown): Promise<T> {
  const aiBaseUrl = process.env.AI_BASE_URL ?? 'http://localhost:8000';

  let res: Response;
  try {
    res = await fetch(`${aiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
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
