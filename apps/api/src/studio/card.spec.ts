import { BadRequestException } from '@nestjs/common';
import { EMPTY_CARD, cardHash, normalizeCard, readiness, type Card } from './card.js';

export function fullCard(): Card {
  return {
    identity: { name: '한지우', oneLiner: '골목 끝 카페를 혼자 꾸리는 바리스타', role: 'guide', occupation: '바리스타', apparentAge: '30대 초반', tags: ['카페', '힐링'] },
    appearance: { description: '앞치마, 짧은 머리', keywords: ['차분함'] },
    personality: {
      warmth: 70, directness: 30, impulse: 20, protectiveness: 60,
      honorific: 'jondae', addressing: '손님이라 부르고, 단골이 되면 이름 뒤에 씨를 붙인다',
      habits: ['말끝을 흐린다'], forbidden: ['인터넷 말투'], summary: '말수가 적지만 다정하다',
    },
    campaign: { scene: '비 오는 오후의 카페', knows: '단골들의 취향', unknown: '유저가 왜 매일 오는지', goal: '가게를 지키는 것', stance: '조심스럽게 마음을 연다', conflictSeed: '재개발 소식' },
    boundary: { secret: '가게를 곧 닫아야 한다', unlockCondition: '친밀도가 높고 유저가 먼저 가게 걱정을 할 때', neverDo: ['AI라고 말하기'], breakers: '가게를 무시할 때' },
    greeting: { firstMessage: '창밖에 비가 그칠 줄 모른다.\n"오늘도 오셨네요."', alternates: [], examples: [{ user: '뭐가 맛있어요?', character: '오늘은 산미 있는 원두예요.' }] },
    lore: { world: '', person: '', taboo: '', extra: [] },
  };
}

describe('normalizeCard', () => {
  it('빈 입력은 빈 카드, 모르는 필드는 버리고 앞뒤 공백은 자른다', () => {
    expect(normalizeCard(undefined)).toEqual(EMPTY_CARD);
    const c = normalizeCard({ identity: { name: '  지우 ', hacker: 1 }, nope: true });
    expect(c.identity.name).toBe('지우');
    expect((c.identity as Record<string, unknown>).hacker).toBeUndefined();
    expect((c as Record<string, unknown>).nope).toBeUndefined();
  });

  it('목록은 빈 칸과 중복을 지운다', () => {
    expect(normalizeCard({ personality: { habits: ['a', ' ', 'a', 'b'] } }).personality.habits).toEqual(['a', 'b']);
  });

  it('상한·형식 위반은 어느 칸인지 알려 주며 400', () => {
    const cases: [unknown, RegExp][] = [
      [{ identity: { oneLiner: 'ㄱ'.repeat(41) } }, /한 줄 소개.*40자/],
      [{ identity: { role: 'villain' } }, /캠페인 역할/],
      [{ personality: { warmth: 101 } }, /온기/],
      [{ personality: { habits: ['a', 'b', 'c', 'd'] } }, /말투 습관.*3개/],
      [{ greeting: { examples: [{}, {}, {}] } }, /예시 대화.*2세트/],
      [{ personality: { honorific: 'polite' } }, /반말\/존댓말/],
    ];
    for (const [input, message] of cases) {
      expect(() => normalizeCard(input)).toThrow(BadRequestException);
      expect(() => normalizeCard(input)).toThrow(message);
    }
  });
});

describe('readiness', () => {
  it('빈 카드: 필수 단계(정체성·성격·캠페인·첫인사)가 모자라 미완성', () => {
    const r = readiness(EMPTY_CARD);
    expect(r.complete).toBe(false);
    const missing = Object.fromEntries(r.steps.map((s) => [s.key, s.missing]));
    expect(missing.identity).toContain('이름');
    expect(missing.personality).toContain('말투 습관 1개 이상');
    expect(missing.campaign).toContain('시작 장면');
    expect(missing.greeting).toEqual(['첫 메시지']);
    expect(missing.appearance).toEqual([]);
  });

  it('다 채운 카드는 완성', () => {
    const r = readiness(fullCard());
    expect(r.complete).toBe(true);
    expect(r.steps.every((s) => s.missing.length === 0)).toBe(true);
  });

  it('비밀만 있고 해금 조건이 없으면 미완성 (비밀은 조건과 쌍)', () => {
    const c = fullCard();
    c.boundary.unlockCondition = '';
    const r = readiness(c);
    expect(r.complete).toBe(false);
    expect(r.steps.find((s) => s.key === 'boundary')?.missing).toEqual(['비밀의 해금 조건']);
  });

  it('비밀·갈등 씨앗이 둘 다 비면 캠페인 밀도 경고', () => {
    const c = fullCard();
    c.boundary.secret = '';
    c.boundary.unlockCondition = '';
    c.campaign.conflictSeed = '';
    expect(readiness(c).warnings.some((w) => w.includes('캠페인 밀도 부족'))).toBe(true);
    expect(readiness(fullCard()).warnings.some((w) => w.includes('캠페인 밀도 부족'))).toBe(false);
  });

  it('자기소개로 시작하는 첫 메시지는 경고', () => {
    const c = fullCard();
    c.greeting.firstMessage = '안녕하세요, 저는 한지우입니다.';
    expect(readiness(c).warnings.some((w) => w.includes('자기소개'))).toBe(true);
  });
});

describe('cardHash', () => {
  it('카드가 바뀌면 지문이 바뀐다', () => {
    const a = fullCard();
    const b = fullCard();
    expect(cardHash(a)).toBe(cardHash(b));
    b.personality.summary += '!';
    expect(cardHash(a)).not.toBe(cardHash(b));
  });
});
