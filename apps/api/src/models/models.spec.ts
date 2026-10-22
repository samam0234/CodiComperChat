import { creditsToKrw, attendanceReward } from '../credits/credits.js';
import { DEFAULT_MODEL_ID, MODELS, dailyLimitOf, enhancedDailyLimit, findModel, kstDay, lockOf } from './models.js';

const model = (id: string) => findModel(id)!;
const free = (usedToday = 0, balance = 0) => ({ plan: 'FREE' as const, usedToday, balance });
const pro = (usedToday = 0, balance = 0) => ({ plan: 'PRO' as const, usedToday, balance });

describe('모델 목록', () => {
  it('기본 무료·강화 무료·Claude 8개·Grok 3개이고 id가 겹치지 않는다', () => {
    expect(MODELS).toHaveLength(13);
    expect(new Set(MODELS.map((m) => m.id)).size).toBe(MODELS.length);
    expect(MODELS.filter((m) => m.group === 'Claude')).toHaveLength(8);
    expect(MODELS.filter((m) => m.group === 'Grok')).toHaveLength(3);
    expect(findModel(DEFAULT_MODEL_ID)?.tier).toBe('BASIC');
  });

  it('기본 모델만 공급자 모델 이름을 비워 services/ai 기본값을 쓴다', () => {
    expect(model('basic').runtime).toBeNull();
    expect(model('enhanced').runtime).toBe('gemma4:12b');
  });

  it('프리미엄만 코레딧 값이 있고, 같은 줄에서는 성능 순으로 오른다', () => {
    for (const m of MODELS) expect(m.credits === null).toBe(m.tier !== 'PREMIUM');
    const claude = ['claude-haiku-5-5', 'claude-haiku-4-5', 'claude-sonnet-5', 'claude-sonnet-5-5', 'claude-opus-4-8', 'claude-opus-5', 'claude-opus-5-5', 'claude-fable-5-1'];
    const costs = claude.map((id) => model(id).credits!);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
    expect(model('grok-4-5').credits! < model('grok-4-7').credits!).toBe(true);
  });
});

describe('쓸 수 있는 조건', () => {
  it('기본 무료는 언제나 열려 있다', () => {
    expect(lockOf(model('basic'), free(9999))).toBeNull();
  });

  it('강화 무료: 무료 등급은 하루 30번까지, 프로는 무제한', () => {
    expect(dailyLimitOf(model('enhanced'), 'FREE', {})).toBe(30);
    expect(lockOf(model('enhanced'), free(29), {})).toBeNull();
    expect(lockOf(model('enhanced'), free(30), {})).toBe('DAILY_LIMIT');
    expect(dailyLimitOf(model('enhanced'), 'PRO', {})).toBeNull();
    expect(lockOf(model('enhanced'), pro(9999), {})).toBeNull();
  });

  it('프리미엄은 연동 전이라 준비 중이고, 연동되면 코레딧이 모자랄 때만 잠긴다 (등급과 상관없다)', () => {
    for (const m of MODELS.filter((x) => x.tier === 'PREMIUM')) {
      expect(lockOf(m, pro(0, 99999), {})).toBe('NOT_READY');
      const ready = { MODEL_PREMIUM_FAKE: '1' };
      expect(lockOf(m, free(0, m.credits! - 1), ready)).toBe('NO_CREDITS');
      expect(lockOf(m, free(0, m.credits!), ready)).toBeNull();
    }
  });

  it('하루 한도는 환경변수로 줄일 수 있고, 이상한 값은 30으로 돌아간다', () => {
    expect(enhancedDailyLimit({ MODEL_ENHANCED_DAILY_LIMIT: '2' })).toBe(2);
    expect(enhancedDailyLimit({ MODEL_ENHANCED_DAILY_LIMIT: '0' })).toBe(30);
    expect(enhancedDailyLimit({ MODEL_ENHANCED_DAILY_LIMIT: 'abc' })).toBe(30);
  });
});

describe('코레딧', () => {
  it('출석하면 무료 1000, 프로 5000', () => {
    expect(attendanceReward('FREE')).toBe(1000);
    expect(attendanceReward('PRO')).toBe(5000);
  });

  it('100 코레딧은 350원', () => {
    expect(creditsToKrw(100)).toBe(350);
    expect(creditsToKrw(1000)).toBe(3500);
    expect(creditsToKrw(50)).toBe(175);
  });
});

describe('하루의 기준', () => {
  it('한국 시각 자정에 날짜가 바뀐다', () => {
    expect(kstDay(new Date('2026-10-21T14:59:59Z'))).toBe('2026-10-21');
    expect(kstDay(new Date('2026-10-21T15:00:00Z'))).toBe('2026-10-22');
  });
});
