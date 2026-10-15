import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PersonaKnowledgeStore } from '../persona-rag/persona-knowledge.store.js';
import { cardHash, type Card } from './card.js';
import { fullCard } from './card.fixture.js';
import { StudioPublishService, knowledgeFileName } from './studio-publish.service.js';

type Draft = { id: string; card: Card; lastTest: unknown; characterId: string | null; visibility: string };

const passedTest = (card: Card) => ({
  cardHash: cardHash(card),
  turns: [],
  verdict: { passed: true },
});

function setup(opts: { role?: 'ADMIN' | 'USER'; verified?: boolean; draft?: Partial<Draft>; nameTakenBy?: string; portrait?: Buffer; portraitReview?: 'APPROVED' | 'PENDING' | 'REJECTED' } = {}) {
  const card = fullCard();
  const draft: Draft = { id: 'd1', card, lastTest: passedTest(card), characterId: null, visibility: 'UNLISTED', ...opts.draft };
  const characters: Record<string, unknown>[] = [];
  const prisma = {
    user: { findUnique: async () => ({ role: opts.role ?? 'ADMIN', emailVerifiedAt: opts.verified === false ? null : new Date() }) },
    character: {
      findUnique: async () => (opts.nameTakenBy ? { id: opts.nameTakenBy } : null),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        characters.push(data);
        return { id: 'c1' };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        characters.push(data);
        return { id: draft.characterId };
      },
    },
    characterDraft: {
      findUnique: async () => ({
        portrait: opts.portrait ?? null,
        portraitMime: opts.portrait ? 'image/png' : null,
        portraitReview: opts.portrait ? (opts.portraitReview ?? 'APPROVED') : null,
      }),
      update: async ({ data }: { data: { characterId?: string; visibility?: string } }) => {
        if (data.characterId) draft.characterId = data.characterId;
        if (data.visibility) draft.visibility = data.visibility;
      },
    },
  };
  const studio = { findOwned: async () => draft, get: async () => ({ id: draft.id, characterId: draft.characterId }) };
  const dir = mkdtempSync(join(tmpdir(), 'studio-publish-'));
  const store = PersonaKnowledgeStore.at(dir);
  const service = new StudioPublishService(prisma as never, studio as never, store);
  return { service, draft, characters, dir, store };
}

describe('공방 발행', () => {
  const dirs: string[] = [];
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

  it('일반 유저도 발행하고, 초안의 공개 범위와 만든 사람이 캐릭터에 실린다', async () => {
    const t = setup({ role: 'USER' });
    dirs.push(t.dir);
    await t.service.publish('u', 'd1');
    expect(t.characters[0]).toMatchObject({ visibility: 'UNLISTED', ownerId: 'u', published: true });
  });

  it('올린 초상은 발행할 때 캐릭터로 옮겨지고, 없으면 비어 있다', async () => {
    const withArt = setup({ portrait: Buffer.from([0x89, 0x50, 0x4e, 0x47]) });
    dirs.push(withArt.dir);
    await withArt.service.publish('u', 'd1');
    expect(withArt.characters[0].portraitMime).toBe('image/png');
    expect(Buffer.from(withArt.characters[0].portrait as Uint8Array)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const without = setup();
    dirs.push(without.dir);
    await without.service.publish('u', 'd1');
    expect(without.characters[0]).toMatchObject({ portrait: null, portraitMime: null });
  });

  it('검수를 기다리거나 반려된 초상은 캐릭터에 싣지 않는다', async () => {
    for (const portraitReview of ['PENDING', 'REJECTED'] as const) {
      const t = setup({ portrait: Buffer.from([0x89, 0x50, 0x4e, 0x47]), portraitReview });
      dirs.push(t.dir);
      await t.service.publish('u', 'd1');
      expect(t.characters[0]).toMatchObject({ portrait: null, portraitMime: null });
    }
  });

  it('공개 범위를 바꾸면 발행 중인 캐릭터에도 바로 적용되고, 잘못된 값은 400', async () => {
    const t = setup({ draft: { characterId: 'c1' } });
    dirs.push(t.dir);
    await t.service.setVisibility('u', 'd1', 'PUBLIC');
    expect(t.draft.visibility).toBe('PUBLIC');
    expect(t.characters.at(-1)).toEqual({ visibility: 'PUBLIC' });
    await expect(t.service.setVisibility('u', 'd1', 'EVERYONE')).rejects.toMatchObject({ status: 400 });
  });

  it('테스트를 통과하지 않았거나 통과 뒤 카드를 고쳤으면 409', async () => {
    const t = setup({ draft: { lastTest: null } });
    dirs.push(t.dir);
    await expect(t.service.publish('u', 'd1')).rejects.toMatchObject({ status: 409 });

    const card = fullCard();
    const stale = passedTest(card);
    card.personality.summary = '고침';
    const t2 = setup({ draft: { card, lastTest: stale } });
    dirs.push(t2.dir);
    await expect(t2.service.publish('u', 'd1')).rejects.toThrow(/테스트/);
  });

  it('이메일을 인증하지 않은 계정은 발행하지 못한다(403)', async () => {
    const t = setup({ role: 'USER', verified: false });
    dirs.push(t.dir);
    await expect(t.service.publish('u', 'd1')).rejects.toThrow(/이메일 인증/);
  });

  it('필수 단계가 비면 409', async () => {
    const card = fullCard();
    card.greeting.firstMessage = '';
    const t = setup({ draft: { card, lastTest: passedTest(card) } });
    dirs.push(t.dir);
    await expect(t.service.publish('u', 'd1')).rejects.toThrow(/필수/);
  });

  it('다른 캐릭터가 같은 이름을 쓰면 409', async () => {
    const t = setup({ nameTakenBy: 'other' });
    dirs.push(t.dir);
    await expect(t.service.publish('u', 'd1')).rejects.toThrow(/이미 있습니다/);
  });

  it('발행하면 캐릭터가 공개되고 지식 파일이 생겨 저장소가 바로 읽는다', async () => {
    const t = setup();
    dirs.push(t.dir);
    await t.service.publish('u', 'd1');

    expect(t.draft.characterId).toBe('c1');
    expect(t.characters[0]).toMatchObject({
      name: '한지우',
      published: true,
      secret: '가게를 곧 닫아야 한다',
      openingScene: fullCard().greeting.firstMessage,
    });
    // 임시 파일은 남지 않고, 비밀은 파일에 없다
    expect(readdirSync(t.dir)).toEqual([knowledgeFileName('d1')]);
    const knowledge = t.store.get('한지우');
    expect(knowledge?.chunks.length).toBeGreaterThan(5);
    expect(JSON.stringify(knowledge)).not.toContain('가게를 곧 닫아야 한다');
  });

  it('다시 발행하면 같은 캐릭터를 고치고, 내리면 지식 파일을 지운다', async () => {
    const t = setup({ draft: { characterId: 'c1' } });
    dirs.push(t.dir);
    await t.service.publish('u', 'd1');
    expect(t.characters).toHaveLength(1);

    await t.service.unpublish('u', 'd1');
    expect(t.characters[1]).toEqual({ published: false });
    expect(existsSync(join(t.dir, knowledgeFileName('d1')))).toBe(false);
    expect(t.store.get('한지우')).toBeNull();
  });
});
