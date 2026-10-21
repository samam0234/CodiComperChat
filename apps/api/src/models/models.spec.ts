import { DEFAULT_MODEL_ID, MODELS, dailyLimitOf, enhancedDailyLimit, findModel, kstDay, lockOf } from './models.js';

const model = (id: string) => findModel(id)!;

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
});

describe('쓸 수 있는 조건', () => {
  it('기본 무료는 언제나 열려 있다', () => {
    expect(lockOf(model('basic'), 'FREE', 9999)).toBeNull();
  });

  it('강화 무료는 하루 30번까지, 30번째를 쓰면 잠긴다', () => {
    expect(dailyLimitOf(model('enhanced'), {})).toBe(30);
    expect(lockOf(model('enhanced'), 'FREE', 29, {})).toBeNull();
    expect(lockOf(model('enhanced'), 'FREE', 30, {})).toBe('DAILY_LIMIT');
    // 프로여도 강화 무료의 한도는 같다
    expect(lockOf(model('enhanced'), 'PRO', 30, {})).toBe('DAILY_LIMIT');
  });

  it('프리미엄은 무료 등급이면 프로 전용, 프로여도 연동 전이라 준비 중이다', () => {
    for (const m of MODELS.filter((x) => x.tier === 'PREMIUM')) {
      expect(lockOf(m, 'FREE', 0)).toBe('PRO_ONLY');
      expect(lockOf(m, 'PRO', 0)).toBe('NOT_READY');
    }
  });

  it('하루 한도는 환경변수로 줄일 수 있고, 이상한 값은 30으로 돌아간다', () => {
    expect(enhancedDailyLimit({ MODEL_ENHANCED_DAILY_LIMIT: '2' })).toBe(2);
    expect(enhancedDailyLimit({ MODEL_ENHANCED_DAILY_LIMIT: '0' })).toBe(30);
    expect(enhancedDailyLimit({ MODEL_ENHANCED_DAILY_LIMIT: 'abc' })).toBe(30);
  });
});

describe('하루의 기준', () => {
  it('한국 시각 자정에 날짜가 바뀐다', () => {
    expect(kstDay(new Date('2026-10-21T14:59:59Z'))).toBe('2026-10-21');
    expect(kstDay(new Date('2026-10-21T15:00:00Z'))).toBe('2026-10-22');
  });
});
