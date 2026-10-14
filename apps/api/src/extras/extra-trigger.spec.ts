import { keywords, selectActive, triggerKeywords, type AppliedExtra } from './extra-trigger.js';

const jia: AppliedExtra = {
  id: 'e1',
  triggers: ['relation'],
  fields: {
    name: '지아',
    summary: '유지성의 여동생, 고등학생',
    personality: '밝고 수다스럽다. 반말',
    relation: '유지성의 여동생',
    situation: '시험 기간에 오빠를 찾아온다',
    place: '스터디카페, 집',
  },
};

describe('조건 단어 뽑기', () => {
  it('조사를 떼고 흔한 말은 뺀다', () => {
    expect(keywords('도서관에서 시험 공부를 할 때')).toEqual(['도서관', '시험', '공부']);
  });
  it('인물 관계에서는 주인공 이름을 뺀다', () => {
    expect(triggerKeywords(jia.fields, '유지성').relation).toEqual(['여동생']);
  });
});

describe('이번 턴 엑스트라 고르기', () => {
  const opening = [{ role: 'character' as const, text: '스터디카페. 유지성이 문제집을 펴 둔다.' }];

  it('조건 단어가 안 나오면 등장하지 않는다', () => {
    expect(selectActive([jia], opening, '오늘 수학 진도 나가요?', '유지성')).toEqual([]);
  });

  it('고른 조건(인물 관계)의 단어가 나오면 등장한다', () => {
    const [active] = selectActive([jia], opening, '선생님 여동생 있어요?', '유지성');
    expect(active?.name).toBe('지아');
    expect(active?.reason).toContain('인물 관계');
  });

  it('고르지 않은 조건(장소)의 단어로는 등장하지 않는다', () => {
    // 시작 장면에 "스터디카페"가 있지만 장소 조건은 꺼져 있다
    expect(selectActive([jia], opening, '여기 조용하네요', '유지성')).toEqual([]);
  });

  it('모두 고르면 장소로도 등장한다', () => {
    const all = { ...jia, triggers: ['relation', 'situation', 'place'] as AppliedExtra['triggers'] };
    expect(selectActive([all], opening, '여기 조용하네요', '유지성')[0]?.reason).toContain('장소');
  });

  it('이름을 부르면 조건과 상관없이 등장한다', () => {
    expect(selectActive([jia], opening, '지아는 잘 지내요?', '유지성')[0]?.reason).toContain('언급');
  });

  it('방금 등장했으면 이어서 나온다, 한 턴 최대 2명', () => {
    const history = [...opening, { role: 'character' as const, text: '"오빠!" 지아가 문을 열고 들어온다.' }];
    expect(selectActive([jia], history, '안녕?', '유지성')).toHaveLength(1);
    const many = ['a', 'b', 'c'].map((n) => ({ ...jia, id: n, fields: { ...jia.fields, name: n + '민' } }));
    expect(selectActive(many, opening, '여동생 얘기 해 줘요', '유지성')).toHaveLength(2);
  });
});

describe('등장 방식 신호(cue)', () => {
  it('이번 말에 걸린 조건이 앞 턴에 남은 조건보다 먼저다', () => {
    const all = { ...jia, triggers: ['relation', 'place'] as AppliedExtra['triggers'] };
    const history = [
      { role: 'user' as const, text: '선생님 여동생 있어요?' },
      { role: 'character' as const, text: '그건 다음에 얘기해요.' },
    ];
    expect(selectActive([all], history, '이 스터디카페 자주 와요?', '유지성')[0]?.cue).toBe('place');
  });
});
