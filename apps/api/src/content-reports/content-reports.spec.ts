import { ContentReportsService, parseContentReport } from './content-reports.service.js';

describe('그림 신고 입력', () => {
  it('대상·사유가 없으면 400', () => {
    expect(() => parseContentReport({})).toThrow(/대상/);
    expect(() => parseContentReport({ target: 'PHOTONET', targetId: 'img_12345678', reason: 'NOPE' })).toThrow(/사유/);
  });

  it('기타는 내용이 있어야 한다', () => {
    expect(() => parseContentReport({ target: 'WEBTOON', targetId: 'webtoon_1', reason: 'OTHER' })).toThrow(/내용/);
    expect(parseContentReport({ target: 'PHOTONET', targetId: 'img_12345678', reason: 'MINOR', detail: ' 어려 보여요 ' })).toEqual({
      target: 'PHOTONET',
      targetId: 'img_12345678',
      reason: 'MINOR',
      detail: '어려 보여요',
    });
  });
});

describe('그림 신고 처리', () => {
  it('내 그림이 아니면 없는 것과 같다', async () => {
    const service = new ContentReportsService({
      photonetImage: { findUnique: async () => ({ blockedAt: null, prompt: '장면', rating: 'nsfw', campaign: { characterId: 'c1', character: { name: '린' }, user: { id: 'owner', displayName: '가', email: 'a@b.c', role: 'USER', suspendedAt: null } } }) },
    } as never);
    await expect(
      service.report('other', 'c1', { target: 'PHOTONET', targetId: 'img_12345678', reason: 'MINOR' }),
    ).rejects.toThrow(/찾을 수 없습니다/);
  });

  it('접근을 막으면 그림과 열린 신고를 함께 처리한다', async () => {
    const updates: string[] = [];
    const service = new ContentReportsService({
      contentReport: {
        findUnique: async () => ({ id: 'r1', target: 'PHOTONET', targetId: 'img_12345678', status: 'OPEN' }),
        updateMany: async () => void updates.push('reports'),
      },
      photonetImage: {
        findUnique: async () => ({
          blockedAt: null,
          prompt: '장면',
          rating: 'nsfw',
          campaign: {
            characterId: 'c1',
            character: { name: '린' },
            user: { id: 'owner', displayName: '가', email: 'a@b.c', role: 'USER', suspendedAt: null },
          },
        }),
        update: async () => void updates.push('image'),
      },
      user: { update: async () => void updates.push('user') },
      $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
    } as never);
    await service.block('r1', '미성년자로 보임', true);
    expect(updates).toEqual(['image', 'reports', 'user']);
  });

  it('운영자 계정은 정지하지 않는다', async () => {
    const service = new ContentReportsService({
      contentReport: {
        findUnique: async () => ({ id: 'r1', target: 'PHOTONET', targetId: 'img_12345678', status: 'OPEN' }),
      },
      photonetImage: {
        findUnique: async () => ({
          blockedAt: null,
          prompt: '장면',
          rating: 'sfw',
          campaign: {
            characterId: 'c1',
            character: { name: '린' },
            user: { id: 'admin', displayName: '운영', email: 'a@b.c', role: 'ADMIN', suspendedAt: null },
          },
        }),
      },
    } as never);
    await expect(service.block('r1', '사유', true)).rejects.toThrow(/운영자/);
  });
});
