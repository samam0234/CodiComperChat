import { EMPTY_STORY, MAX_OPEN_HOOKS, applyDigest, similar, type DigestResult, type StoryState } from './story-logic.js';

const NOW = new Date('2026-10-15T00:00:00Z');
let n = 0;
const newId = () => `h${++n}`;
const digest = (over: Partial<DigestResult> = {}): DigestResult => ({
  brief: '',
  relationDelta: [],
  hooksOpen: [],
  hooksClosed: [],
  ...over,
});

describe('비슷한 복선 판별', () => {
  it('표현만 다른 같은 약속은 비슷하다', () => {
    expect(similar('다음 주 모의고사 후 함께 치킨 먹기 약속', '다음 주 모의고사가 끝나면 치킨을 같이 먹기로 했다')).toBe(true);
  });
  it('다른 일은 비슷하지 않다', () => {
    expect(similar('다음 주 모의고사 후 치킨 먹기', '유지성이 3년 전 그만둔 일을 숨기고 있다')).toBe(false);
  });
});

describe('친밀도 자동 변화', () => {
  it('폭을 제한하고 0~100 안에 둔다', () => {
    const r = applyDigest(EMPTY_STORY, 98, true, digest({ relationDelta: [{ delta: 50, reason: '아주 크게' }] }), NOW, newId);
    expect(r.relationshipValue).toBe(100);
    expect(r.story.relationshipLog).toEqual([{ at: NOW.toISOString(), delta: 2, value: 100, reason: '아주 크게' }]);
    const low = applyDigest(EMPTY_STORY, 3, true, digest({ relationDelta: [{ delta: -50, reason: '심한 말' }] }), NOW, newId);
    expect(low.relationshipValue).toBe(0);
  });
  it('-8~+8로 자른다', () => {
    const r = applyDigest(EMPTY_STORY, 50, true, digest({ relationDelta: [{ delta: 30, reason: '' }] }), NOW, newId);
    expect(r.relationshipValue).toBe(58);
  });
  it('자동 변화를 끄면 값과 기록을 건드리지 않는다', () => {
    const r = applyDigest(EMPTY_STORY, 50, false, digest({ relationDelta: [{ delta: 5, reason: '좋았다' }] }), NOW, newId);
    expect(r.relationshipValue).toBe(50);
    expect(r.story.relationshipLog).toEqual([]);
    expect(r.relationshipReason).toBeNull();
  });
  it('변화가 0이면 기록은 없고 이유만 남는다', () => {
    const r = applyDigest(EMPTY_STORY, 50, true, digest({ relationDelta: [{ delta: 0, reason: '평범한 수업' }] }), NOW, newId);
    expect(r.relationshipValue).toBe(50);
    expect(r.story.relationshipLog).toEqual([]);
    expect(r.relationshipReason).toBe('평범한 수업');
  });
  it('기록은 최근 10개만', () => {
    let story: StoryState = EMPTY_STORY;
    let value = 10;
    for (let i = 0; i < 14; i++) {
      const r = applyDigest(story, value, true, digest({ relationDelta: [{ delta: 1, reason: `r${i}` }] }), NOW, newId);
      story = r.story;
      value = r.relationshipValue;
    }
    expect(story.relationshipLog).toHaveLength(10);
    expect(story.relationshipLog[9].reason).toBe('r13');
  });
});

describe('복선', () => {
  it('새 복선을 열고, 이미 있거나 끝난 것과 비슷하면 버린다', () => {
    const a = applyDigest(EMPTY_STORY, 0, true, digest({ hooksOpen: [{ text: '다음 주 모의고사가 끝나면 치킨을 같이 먹기로 했다' }] }), NOW, newId);
    expect(a.story.openHooks).toHaveLength(1);
    const b = applyDigest(a.story, 0, true, digest({ hooksOpen: [{ text: '다음 주 모의고사 후 함께 치킨 먹기 약속' }] }), NOW, newId);
    expect(b.story.openHooks).toHaveLength(1);
    const id = a.story.openHooks[0].id;
    const c = applyDigest(b.story, 0, true, digest({ hooksClosed: [{ id }] }), NOW, newId);
    expect(c.story.openHooks).toHaveLength(0);
    expect(c.story.closedEvents).toEqual(['다음 주 모의고사가 끝나면 치킨을 같이 먹기로 했다']);
    // 끝난 일을 다시 열지 않는다
    const d = applyDigest(c.story, 0, true, digest({ hooksOpen: [{ text: '모의고사가 끝나면 치킨 같이 먹기' }] }), NOW, newId);
    expect(d.story.openHooks).toHaveLength(0);
  });
  it('모르는 id는 무시하고, 열린 복선은 최대 5개(오래된 것부터 밀림)', () => {
    let story: StoryState = EMPTY_STORY;
    const texts = [
      '비 오는 날 우산을 빌려준 사람을 찾는다',
      '도서관 지하 서고의 잠긴 문 열쇠를 구한다',
      '내일 오후 세 시 수학 시험이 있다',
      '동생이 보낸 편지에 답장을 해야 한다',
      '옥상 정원의 화분이 시들어 간다',
      '졸업 앨범 사진을 같이 고르기로 했다',
      '밤마다 들리는 피아노 소리의 정체',
    ];
    for (const text of texts) {
      story = applyDigest(story, 0, true, digest({ hooksOpen: [{ text }] }), NOW, newId).story;
    }
    expect(story.openHooks.map((h) => h.text)).toEqual(texts.slice(-MAX_OPEN_HOOKS));
    expect(story.openHooks).toHaveLength(MAX_OPEN_HOOKS);
    const same = applyDigest(story, 0, true, digest({ hooksClosed: [{ id: 'nope' }] }), NOW, newId);
    expect(same.story.openHooks).toHaveLength(MAX_OPEN_HOOKS);
  });
  it('요약이 비면 이전 요약을 지키고, 새 요약이 있으면 바꾼다', () => {
    const base: StoryState = { ...EMPTY_STORY, brief: '이전 요약' };
    expect(applyDigest(base, 0, true, digest(), NOW, newId).story.brief).toBe('이전 요약');
    expect(applyDigest(base, 0, true, digest({ brief: '새 요약' }), NOW, newId).story.brief).toBe('새 요약');
  });
});
