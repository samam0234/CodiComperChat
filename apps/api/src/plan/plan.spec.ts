import { effectivePlan, extendPro, multiplierFor } from './plan.js';
import { limitsFor, normalizeCard, EMPTY_CARD, type Card } from '../studio/card.js';
import { fullCard } from '../studio/card.fixture.js';
import { splitText, toKnowledge } from '../studio/card-export.js';

describe('요금 등급', () => {
  const now = new Date('2026-10-15T00:00:00Z');
  it('PRO는 만료 전까지만 PRO다 (만료 시각이 없으면 계속)', () => {
    expect(effectivePlan({ plan: 'PRO', planUntil: null }, now)).toBe('PRO');
    expect(effectivePlan({ plan: 'PRO', planUntil: new Date('2026-11-01') }, now)).toBe('PRO');
    expect(effectivePlan({ plan: 'PRO', planUntil: new Date('2026-10-01') }, now)).toBe('FREE');
    expect(effectivePlan({ plan: 'FREE', planUntil: new Date('2027-01-01') }, now)).toBe('FREE');
  });
  it('프로는 긴 글 칸이 3배, 무료는 1배', () => {
    expect(multiplierFor('FREE')).toBe(1);
    expect(multiplierFor('PRO')).toBe(3);
  });
});

describe('카드 글자 수 한도와 등급', () => {
  const withScene = (n: number): Card => {
    const c = fullCard();
    c.campaign.scene = '가'.repeat(n);
    return c;
  };

  it('긴 글 칸만 배수로 늘고, 이름·한 줄 소개·호칭 규칙 같은 짧은 칸은 그대로다', () => {
    const free = limitsFor(1);
    const pro = limitsFor(3);
    expect(pro.field).toBe(free.field * 3);
    expect(pro.firstMessage).toBe(free.firstMessage * 3);
    expect(pro.summary).toBe(free.summary * 3);
    expect(pro.lore).toBe(free.lore * 3);
    for (const key of ['name', 'oneLiner', 'addressing', 'item', 'tag', 'exampleLine'] as const) expect(pro[key]).toBe(free[key]);
  });

  it('무료는 400자를 넘기면 400, 프로는 1200자까지 받는다', () => {
    expect(() => normalizeCard(withScene(401), { multiplier: 1 })).toThrow(/400자 이하/);
    expect(normalizeCard(withScene(1200), { multiplier: 3 }).campaign.scene).toHaveLength(1200);
    expect(() => normalizeCard(withScene(1201), { multiplier: 3 })).toThrow(/1200자 이하/);
  });

  it('프로 이름·한 줄 소개는 여전히 짧다', () => {
    const c = fullCard();
    c.identity.oneLiner = '가'.repeat(41);
    expect(() => normalizeCard(c, { multiplier: 3 })).toThrow(/40자 이하/);
  });

  it('등급이 끝나도 이미 저장된 긴 글은 그대로 두고 다른 칸을 저장할 수 있다', () => {
    const saved = withScene(900);
    // 무료가 됐지만 장면은 그대로, 다른 칸(목표)만 고침 → 통과
    const edited = structuredClone(saved);
    edited.campaign.goal = '새 목표';
    expect(normalizeCard(edited, { multiplier: 1, existing: saved }).campaign.scene).toHaveLength(900);
    // 장면을 조금이라도 바꾸면 무료 한도가 적용된다
    edited.campaign.scene += '나';
    expect(() => normalizeCard(edited, { multiplier: 1, existing: saved })).toThrow(/400자 이하/);
    // 줄이는 것은 허용 (한도 이하로 줄이면 통과)
    edited.campaign.scene = '가'.repeat(400);
    expect(normalizeCard(edited, { multiplier: 1, existing: saved }).campaign.scene).toHaveLength(400);
  });

  it('읽을 때(multiplier Infinity)는 길이를 보지 않는다', () => {
    expect(normalizeCard(withScene(5000), { multiplier: Number.POSITIVE_INFINITY }).campaign.scene).toHaveLength(5000);
    expect(normalizeCard(EMPTY_CARD, { multiplier: Number.POSITIVE_INFINITY }).identity.name).toBe('');
  });
});

describe('긴 글은 잘리지 않고 여러 지식 조각이 된다', () => {
  it('문장 단위로 나누고 조각마다 상한 안이다', () => {
    const long = Array.from({ length: 30 }, (_, i) => `이것은 ${i}번째 문장이고 꽤 길게 이어지는 이야기입니다.`).join(' ');
    const pieces = splitText(long);
    expect(pieces.length).toBeGreaterThan(1);
    for (const piece of pieces) expect(piece.length).toBeLessThanOrEqual(480);
    // 내용은 하나도 빠지지 않는다
    expect(pieces.join(' ').replace(/\s+/g, '')).toBe(long.replace(/\s+/g, ''));
  });
  it('문장이 하나뿐이어도 글자 수로 나눈다', () => {
    const one = '가'.repeat(1300);
    const pieces = splitText(one);
    expect(pieces.length).toBe(3);
    expect(pieces.join('')).toBe(one);
  });
  it('프로 카드(장면 1200자·첫 메시지 1200자)도 지식 파일 검증을 통과하고 본문이 다 들어간다', () => {
    const card = fullCard();
    card.campaign.scene = Array.from({ length: 40 }, (_, i) => `장면 ${i}의 설명이 이어집니다.`).join(' ');
    card.personality.summary = '다정하지만 속을 잘 드러내지 않는 사람이다. '.repeat(14);
    const knowledge = toKnowledge(card);
    const scene = knowledge.chunks.filter((c) => c.id === 'card-scene' || c.id.startsWith('card-scene-'));
    expect(scene.length).toBeGreaterThan(1);
    expect(scene.map((c) => c.text).join(' ').replace(/\s+/g, '')).toBe(card.campaign.scene.replace(/\s+/g, ''));
    expect(knowledge.chunks.some((c) => c.id === 'card-personality')).toBe(true);
    for (const c of knowledge.chunks) expect(c.text.length).toBeLessThanOrEqual(500);
  });
});

describe('프로 기간 늘리기', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  const day = 86_400_000;

  it('프로가 아니거나 끝났으면 지금부터 센다', () => {
    expect(extendPro({ plan: 'FREE', planUntil: null }, 30, now)).toEqual(new Date(now.getTime() + 30 * day));
    expect(extendPro({ plan: 'PRO', planUntil: new Date('2026-09-01T00:00:00Z') }, 30, now)).toEqual(new Date(now.getTime() + 30 * day));
  });

  it('남은 프로 기간이 있으면 그 뒤에 붙인다', () => {
    const until = new Date('2026-10-11T00:00:00Z');
    expect(extendPro({ plan: 'PRO', planUntil: until }, 30, now)).toEqual(new Date(until.getTime() + 30 * day));
  });

  it('만료 없는 프로는 그대로 만료 없음', () => {
    expect(extendPro({ plan: 'PRO', planUntil: null }, 30, now)).toBeNull();
  });
});
