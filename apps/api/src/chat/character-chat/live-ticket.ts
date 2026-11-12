import { randomBytes } from 'node:crypto';

// 웹소켓은 브라우저가 httpOnly 쿠키를 API 주소로 보내지 못한다.
// 짧은 표는 이미 로그인한 POST에서만 만들고, 한 번 쓰면 버린다.

const TTL_MS = 30_000;

export type LiveClaim = {
  characterId: string;
  message: string;
  personaId: string;
  model?: string;
  authorization?: string;
};

type Row = LiveClaim & { expires: number };

const tickets = new Map<string, Row>();

export function issueLiveTicket(claim: LiveClaim): string {
  const id = randomBytes(24).toString('hex');
  tickets.set(id, { ...claim, expires: Date.now() + TTL_MS });
  return id;
}

export function takeLiveTicket(id: string): LiveClaim | null {
  const row = tickets.get(id);
  if (!row) return null;
  tickets.delete(id);
  if (row.expires < Date.now()) return null;
  const { expires: _expires, ...claim } = row;
  return claim;
}
