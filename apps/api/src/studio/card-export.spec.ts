import { buildContextSlice } from '../character-chat/character-chat.context.js';
import { retrieve } from '../persona-rag/retriever.js';
import { fullCard } from './card.fixture.js';
import { speechText, toCharacterFields, toKnowledge } from './card-export.js';
import { secretLeaked } from './studio-test.service.js';
import { testState } from './test-session.js';
import { cardHash } from './card.js';

describe('카드 → 채팅 공개 필드', () => {
  it('첫인사가 채팅 첫 메시지(openingScene)가 된다', () => {
    const f = toCharacterFields(fullCard());
    expect(f.openingScene).toBe(fullCard().greeting.firstMessage);
    expect(f.name).toBe('한지우');
    expect(f.profile).toEqual({ occupation: '바리스타' });
  });

  it('비밀·해금 조건은 어디에도 실리지 않는다', () => {
    const card = fullCard();
    const everything = JSON.stringify([toCharacterFields(card), toKnowledge(card)]);
    expect(everything).not.toContain(card.boundary.secret);
    expect(everything).not.toContain(card.boundary.unlockCondition);
  });

  it('컨텍스트 조립기가 높임을 제대로 읽는다 (섞어 쓰기는 존댓말로 오판하지 않음)', () => {
    const slice = (honorific: 'jondae' | 'banmal' | 'mix') => {
      const card = fullCard();
      card.personality.honorific = honorific;
      return buildContextSlice({ id: 'x', createdAt: new Date(), ...toCharacterFields(card) } as never, []).character.speech.honorific;
    };
    expect(slice('jondae')).toBe('jondae');
    expect(slice('banmal')).toBe('banmal');
    expect(slice('mix')).toBe('mix');
  });

  it('말투 문장에 습관·금지 말투가 들어간다', () => {
    expect(speechText(fullCard())).toBe('존댓말 기본. 습관: 말끝을 흐린다. 쓰지 않는 말투: 인터넷 말투');
  });
});

describe('카드 → 페르소나 지식 JSON', () => {
  it('persona-rag 검증기를 통과하고 core에 정체성·호칭·말투·금기가 있다', () => {
    const k = toKnowledge(fullCard());
    expect(k.character).toBe('한지우');
    expect(k.core.join('\n')).toMatch(/호칭: 손님이라/);
    expect(k.core.join('\n')).toMatch(/절대 하지 않는 것: AI라고 말하기/);
    expect(k.chunks.map((c) => c.id)).toEqual(
      expect.arrayContaining(['card-scene', 'card-unknown', 'card-conflict', 'speech-example-1', 'guard-unwritten']),
    );
  });

  it('빈 칸은 조각을 만들지 않는다', () => {
    const k = toKnowledge(fullCard());
    expect(k.chunks.some((c) => c.id === 'lore-world')).toBe(false);
  });

  it('검색이 카드 내용으로 동작한다 (재개발 → 갈등 씨앗, 가족 → 안전장치)', () => {
    const k = toKnowledge(fullCard());
    expect(retrieve(k.chunks, { message: '요즘 재개발 얘기 들었어요?', recent: [] })[0]?.chunk.id).toBe('card-conflict');
    expect(retrieve(k.chunks, { message: '가족은 어떻게 되세요?', recent: [] })[0]?.chunk.id).toBe('guard-unwritten');
  });
});

describe('비밀 누설 검사', () => {
  const secret = '가게를 곧 닫아야 한다는 사실';
  it('비밀과 비슷한 말이 나오면 걸린다', () => {
    expect(secretLeaked(secret, ['사실 이 가게, 곧 닫아야 해요.'])).toBe(true);
  });
  it('관계없는 말은 통과', () => {
    expect(secretLeaked(secret, ['오늘은 라떼가 좋겠어요.', '비가 오네요.'])).toBe(false);
  });
  it('비밀이 없거나 너무 짧으면 검사하지 않는다', () => {
    expect(secretLeaked('', ['아무 말'])).toBe(false);
    expect(secretLeaked('빚', ['빚이 있어요'])).toBe(false);
  });
});

describe('테스트 상태', () => {
  it('카드를 고치면 예전 테스트는 무효(stale)', () => {
    const card = fullCard();
    const session = { cardHash: cardHash(card), turns: [{ role: 'user', text: 'a' }], verdict: null };
    expect(testState(card, session)).toMatchObject({ turnsUsed: 1, stale: false, passed: false });
    card.personality.summary = '바뀜';
    expect(testState(card, session)).toMatchObject({ turnsUsed: 0, stale: true, passed: false });
    expect(testState(card, null)).toMatchObject({ turnsUsed: 0, stale: false });
  });
});
