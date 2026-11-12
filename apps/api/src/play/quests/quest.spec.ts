import { EMPTY_QUEST, isComplete, isRewardNote, nextQuestState, parseQuest, parseQuestState, questNote, stage, unlocked, type Quest } from './quest.js';

const quest: Quest = { title: '멈춰 둔 서랍', offer: '옛 노트를 같이 봐 달라고 부탁한다', objective: '유저가 노트의 문제를 함께 풀어 준다', reward: '처음으로 자기 얘기를 이어서 한다', unlockAt: 40 };
const now = new Date('2026-10-24T03:00:00Z');

describe('비밀 퀘스트', () => {
  it('제목·부탁·달성 조건이 모두 있어야 퀘스트로 읽는다', () => {
    expect(parseQuest(quest)).toEqual(quest);
    expect(parseQuest({ ...quest, objective: '' })).toBeNull();
    expect(parseQuest({ ...quest, title: '  ' })).toBeNull();
    expect(parseQuest(null)).toBeNull();
    expect(parseQuest([])).toBeNull();
    expect(isComplete(EMPTY_QUEST)).toBe(false);
    // 문턱은 0~100으로 맞추고, 숫자가 아니면 기본값
    expect(parseQuest({ ...quest, unlockAt: 250 })?.unlockAt).toBe(100);
    expect(parseQuest({ ...quest, unlockAt: '높음' })?.unlockAt).toBe(EMPTY_QUEST.unlockAt);
  });

  it('저장된 진행 상태를 읽는다', () => {
    expect(parseQuestState({ status: 'offered', at: 'x' })).toEqual({ status: 'offered', at: 'x' });
    expect(parseQuestState({ status: 'done', at: 'x', staged: true })).toEqual({ status: 'done', at: 'x', staged: true });
    expect(parseQuestState({ status: 'cheating' })).toBeNull();
    expect(parseQuestState(undefined)).toBeNull();
  });

  it('친밀도가 문턱 아래면 캐릭터에게 아무것도 알리지 않는다', () => {
    expect(unlocked(quest, 39)).toBe(false);
    expect(questNote(quest, 39, null)).toBeNull();
    expect(questNote(quest, 40, null)).toContain(quest.offer);
  });

  it('캐릭터 지시에는 달성 조건을 넣지 않는다', () => {
    for (const state of [null, { status: 'offered' as const, at: '' }, { status: 'done' as const, at: '' }]) {
      expect(questNote(quest, 90, state) ?? '').not.toContain(quest.objective);
    }
  });

  it('건넨 뒤에는 되풀이해 조르지 않게, 달성 직후 첫 답에서만 보상 장면을 보여 준다', () => {
    expect(questNote(quest, 90, { status: 'offered', at: '' })).toContain('되풀이해 조르지 않는다');
    const done = { status: 'done' as const, at: '' };
    expect(questNote(quest, 90, done)).toContain(quest.reward);
    expect(questNote(quest, 90, stage(done))).toBeNull();
    // 보상 장면이 없으면 말을 붙이지 않는다
    expect(questNote({ ...quest, reward: '' }, 90, done)).toBeNull();
  });

  it('건넸다는 판정은 문턱 이상에서만 받고, 건넨 뒤에만 달성할 수 있다', () => {
    // 문턱 아래의 판정은 무시
    expect(nextQuestState(quest, null, 20, { offered: true, done: true }, now)).toEqual({ state: null, completedNow: false });
    // 건넨 적 없이 달성했다고 해도 무효
    expect(nextQuestState(quest, null, 60, { offered: false, done: true }, now)).toEqual({ state: null, completedNow: false });
    // 이번 정리에서 건넴
    const offered = nextQuestState(quest, null, 60, { offered: true, done: false }, now);
    expect(offered.state).toEqual({ status: 'offered', at: now.toISOString() });
    expect(offered.completedNow).toBe(false);
    // 건넨 뒤 달성
    const done = nextQuestState(quest, offered.state, 60, { offered: false, done: true }, now);
    expect(done.state?.status).toBe('done');
    expect(done.completedNow).toBe(true);
    // 건넨 것과 달성이 같은 정리에서 나와도 인정
    expect(nextQuestState(quest, null, 60, { offered: true, done: true }, now).completedNow).toBe(true);
  });

  it('달성 때 고른 보상 갈래를 상태에 남기고, 그 장면 하나만 지시한다', () => {
    const offered = { status: 'offered' as const, at: 'a' };
    const next = nextQuestState(quest, offered, 60, { offered: false, done: true, scene: ' 사직서를 올려 둔다. ' }, now);
    expect(next.state).toEqual({ status: 'done', at: now.toISOString(), scene: '사직서를 올려 둔다.' });
    const note = questNote({ ...quest, reward: '혼인이라면: 이름을 부른다. 충돌이라면: 사직서를 올려 둔다.' }, 90, next.state) ?? '';
    expect(note).toContain('사직서를 올려 둔다.');
    expect(note).not.toContain('이름을 부른다');
    expect(note).not.toContain('갈래 하나만');
    // 고르지 못했으면 전체를 넘기고 고르라고 한다
    expect(questNote(quest, 90, { status: 'done', at: '' })).toContain('갈래 하나만');
    // 빈 갈래는 남기지 않는다
    expect(nextQuestState(quest, offered, 60, { offered: false, done: true, scene: '  ' }, now).state).toEqual({ status: 'done', at: now.toISOString() });
    // 저장된 값에서도 읽고, 달성 전 상태의 갈래는 무시한다
    expect(parseQuestState({ status: 'done', at: 'x', scene: '장면' })).toEqual({ status: 'done', at: 'x', scene: '장면' });
    expect(parseQuestState({ status: 'offered', at: 'x', scene: '장면' })).toEqual({ status: 'offered', at: 'x' });
  });

  it('이미 달성했으면 다시 보상하지 않는다', () => {
    const done = { status: 'done' as const, at: 'a' };
    expect(nextQuestState(quest, done, 90, { offered: true, done: true }, now)).toEqual({ state: done, completedNow: false });
  });
});

describe('보상 장면 지시', () => {
  it('달성 직후 지시만 보상 장면으로 구분한다', () => {
    const q = { title: '문제집', offer: '부탁', objective: '조건', reward: '보상 장면', unlockAt: 10 };
    expect(isRewardNote(questNote(q, 50, { status: 'done', at: '' }) ?? '')).toBe(true);
    expect(isRewardNote(questNote(q, 50, null) ?? '')).toBe(false);
    expect(isRewardNote(questNote(q, 50, { status: 'offered', at: '' }) ?? '')).toBe(false);
  });
});
