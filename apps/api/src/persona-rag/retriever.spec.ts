import { example } from './persona-example.fixture.js';
import { retrieve, scoreChunks, tokenize } from './retriever.js';

const ids = (message: string, recent: string[] = [], options = {}) =>
  retrieve(example().chunks, { message, recent }, options).map((p) => p.chunk.id);

describe('한국어 토큰화', () => {
  it('조사가 붙어도 어간의 글자쌍이 겹친다', () => {
    const a = tokenize('진로를 고민한다');
    const b = tokenize('진로가 막막하다');
    expect([...a.keys()].filter((t) => b.has(t))).toContain('진로');
  });

  it('한 글자 낱말도 어간으로 남긴다', () => {
    expect(tokenize('키가 커요').has('키')).toBe(true);
  });
});

describe('검색', () => {
  it('질문과 관련된 조각을 최상위로 고른다', () => {
    expect(ids('카페 열기 전에 회사 다니셨어요?')[0]).toBe('backstory-quit-job');
    expect(ids('비 오는 날 좋아하세요?')[0]).toBe('preference-rainy-day');
    expect(ids('가족은 어떻게 되세요?')[0]).toBe('boundary-family');
  });

  it('본문에만 있는 고유명사도 찾는다 (키워드에 없어도)', () => {
    expect(ids('보리는 잘 지내요?')[0]).toBe('relationship-cat');
  });

  it('작성자가 적은 키워드는 조사가 붙은 질문에서도 잡힌다', () => {
    expect(ids('고양이를 키우세요?')).toContain('relationship-cat');
  });

  it('"그건 왜요?" 같은 후속 질문은 직전 대화 맥락으로 검색된다', () => {
    const alone = ids('그건 왜요?');
    const withContext = ids('그건 왜요?', [
      '카페를 열기 전에 회사 다니셨어요?',
      '광고 회사에서 5년 일하다 그만뒀어요.',
    ]);
    expect(alone).not.toContain('backstory-quit-job');
    expect(withContext[0]).toBe('backstory-quit-job');
  });

  it('설정과 무관한 화제에서는 억지로 채우지 않는다', () => {
    expect(ids('오늘 주식 시장이 어때요')).toEqual([]);
  });

  it('직전 대화가 이번 말보다 검색을 좌우하지 않는다', () => {
    const top = ids('비 오는 날 좋아하세요?', ['가족 이야기를 해 주세요', '부모님은 어떤 분이세요']);
    expect(top[0]).toBe('preference-rainy-day');
  });

  it('본문 글자 예산을 넘기지 않는다', () => {
    const picked = retrieve(
      example().chunks,
      { message: '카페 회사 비 오는 날 고양이 가족', recent: [] },
      { charBudget: 90, topK: 5 },
    );
    const total = picked.reduce((sum, p) => sum + p.chunk.text.length, 0);
    // 가장 관련 있는 첫 조각은 예산보다 길어도 들어가고, 둘째부터는 합이 예산을 넘지 않을 때만 더한다
    expect(picked.length).toBeGreaterThanOrEqual(1);
    expect(picked.length === 1 || total <= 90).toBe(true);
    expect(picked.length).toBeLessThan(5);
  });

  it('전체 점수는 높은 순이다', () => {
    const scored = scoreChunks(example().chunks, { message: '비 오는 날', recent: [] });
    for (let i = 1; i < scored.length; i++) expect(scored[i - 1].score).toBeGreaterThanOrEqual(scored[i].score);
  });
});
