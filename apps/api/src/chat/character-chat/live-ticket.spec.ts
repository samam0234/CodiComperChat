import { describe, expect, it } from 'vitest';
import { issueLiveTicket, takeLiveTicket } from './live-ticket.js';

describe('대화 웹소켓 표', () => {
  it('한 번 쓰면 다시 쓸 수 없다', () => {
    const id = issueLiveTicket({ characterId: 'c', message: '안녕', personaId: 'p' });
    expect(takeLiveTicket(id)?.message).toBe('안녕');
    expect(takeLiveTicket(id)).toBeNull();
  });

  it('없는 표는 거절한다', () => {
    expect(takeLiveTicket('없는표')).toBeNull();
  });
});
