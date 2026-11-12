import { ReportsService, parseNote, parseReport } from './reports.service.js';

describe('신고 입력 검증', () => {
  it('사유가 목록에 없거나 비면 400', () => {
    expect(() => parseReport({})).toThrow(/사유/);
    expect(() => parseReport({ reason: 'BORING' })).toThrow(/사유/);
    expect(parseReport({ reason: 'SPAM' })).toEqual({ reason: 'SPAM', detail: '' });
  });
  it('기타는 내용이 있어야 하고 500자까지', () => {
    expect(() => parseReport({ reason: 'OTHER' })).toThrow(/내용/);
    expect(() => parseReport({ reason: 'SPAM', detail: 'ㄱ'.repeat(501) })).toThrow(/500자/);
  });
  it('내리는 사유는 필수, 기각 메모는 선택', () => {
    expect(() => parseNote('', true)).toThrow(/사유/);
    expect(parseNote('  부적절  ', true)).toBe('부적절');
    expect(parseNote(undefined, false)).toBe('');
  });
});

type Rep = { characterId: string; reporterId: string; status: string };

function setup(character: Record<string, unknown> | null, reports: Rep[] = []) {
  const created: Rep[] = [];
  const prisma = {
    character: {
      findFirst: async () => character,
      findUnique: async () => character,
      update: async () => ({}),
      updateMany: async () => ({ count: character ? 1 : 0 }),
    },
    characterReport: {
      findFirst: async ({ where }: { where: Rep }) => reports.find((r) => r.reporterId === where.reporterId && r.characterId === where.characterId && r.status === 'OPEN') ?? null,
      count: async () => reports.filter((r) => r.status === 'OPEN').length,
      create: async ({ data }: { data: Rep }) => void created.push(data),
      updateMany: async () => ({ count: reports.length }),
    },
    $transaction: async (ops: unknown[]) => ops,
  };
  return { service: new ReportsService(prisma as never), created };
}

describe('신고', () => {
  it('보이는 남의 캐릭터를 신고하면 접수된다', async () => {
    const t = setup({ id: 'c1', ownerId: 'owner' });
    await t.service.report('u1', 'c1', { reason: 'HATE', detail: '혐오 표현' });
    expect(t.created).toEqual([{ characterId: 'c1', reporterId: 'u1', reason: 'HATE', detail: '혐오 표현' }]);
  });
  it('보이지 않는 캐릭터(비공개·내려감·없음)는 404', async () => {
    await expect(setup(null).service.report('u1', 'c1', { reason: 'SPAM' })).rejects.toMatchObject({ status: 404 });
  });
  it('내 캐릭터는 신고할 수 없다', async () => {
    await expect(setup({ id: 'c1', ownerId: 'u1' }).service.report('u1', 'c1', { reason: 'SPAM' })).rejects.toMatchObject({ status: 400 });
  });
  it('같은 캐릭터를 열린 신고가 있는 채 또 신고하면 409', async () => {
    const t = setup({ id: 'c1', ownerId: 'o' }, [{ characterId: 'c1', reporterId: 'u1', status: 'OPEN' }]);
    await expect(t.service.report('u1', 'c1', { reason: 'SPAM' })).rejects.toMatchObject({ status: 409 });
  });
  it('내리기는 사유가 필요하고, 없는 캐릭터·처리할 신고가 없으면 404', async () => {
    await expect(setup({ id: 'c1' }).service.takeDown('c1', '')).rejects.toMatchObject({ status: 400 });
    await expect(setup(null).service.takeDown('c1', '사유')).rejects.toMatchObject({ status: 404 });
    await expect(setup({ id: 'c1' }).service.restore('x')).resolves.toBeUndefined();
    await expect(setup(null).service.restore('x')).rejects.toMatchObject({ status: 404 });
  });
});
