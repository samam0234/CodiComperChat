import { CharacterVisibility } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WORLD_SETTINGS,
  LADDER_LANES,
  MAZE_SIZE,
  WALL,
  canView,
  eventNote,
  kstDay,
  ladderEnd,
  makeLadder,
  makeMaze,
  makeSetup,
  parseWorldDocument,
  parseWorldSettings,
  publicView,
  publishProblems,
  resolveEvent,
  rewardFor,
  segments,
  shouldStartEvent,
  walkMaze,
  type Rng,
} from './world.js';

// 정해진 순서로 값을 내는 가짜 난수 (끝나면 처음부터)
const seq = (...values: number[]): Rng => {
  let i = 0;
  return (max) => values[i++ % values.length] % max;
};
const random: Rng = (max) => Math.floor(Math.random() * max);

describe('세계관 문서', () => {
  const doc = {
    title: ' 별빛 항구 ',
    setting: '증기선이 오가는 항구 도시, 밤마다 등대가 켜진다',
    mode: 'novel',
    places: [
      { name: '부두', x: 10, y: 80.55 },
      { name: '등대', x: 90, y: 10 },
    ],
    cast: [{ name: '한서린', summary: '관리인', startPlace: '부두', homePlace: '등대' }],
    parts: [{ title: '1부', goal: '등대지기를 만난다' }],
  };

  it('다듬어 읽고 모드·좌표를 정리한다', () => {
    const parsed = parseWorldDocument(doc);
    expect(parsed.title).toBe('별빛 항구');
    expect(parsed.mode).toBe('NOVEL');
    expect(parsed.places[0].y).toBe(80.6);
    expect(parsed.cast[0]).toMatchObject({ startPlace: '부두', homePlace: '등대', characterId: null });
  });

  it('없는 장소, 겹친 이름, 범위 밖 좌표, 빈 파트 목표, 잘못된 모드를 막는다', () => {
    expect(() => parseWorldDocument({ ...doc, cast: [{ name: 'A', startPlace: '달' }] })).toThrow('장소 목록에 없어요');
    expect(() => parseWorldDocument({ ...doc, cast: [{ name: 'A' }, { name: 'A' }] })).toThrow('겹쳐요');
    expect(() => parseWorldDocument({ ...doc, places: [{ name: 'X', x: 101, y: 0 }] })).toThrow('0~100');
    expect(() => parseWorldDocument({ ...doc, parts: [{ title: '1부', goal: '' }] })).toThrow('제목과 목표');
    expect(() => parseWorldDocument({ ...doc, mode: 'tv' })).toThrow('대화 방식');
    expect(() => parseWorldDocument({ ...doc, title: 'x'.repeat(41) })).toThrow('40자');
  });

  it('발행에 빠진 것을 알려 준다', () => {
    expect(publishProblems({ title: '', setting: '짧음', opening: '', castCount: 0 })).toEqual([
      '제목',
      '세계관 설명(20자 이상)',
      '첫 장면',
      '등장인물 1명 이상',
    ]);
    expect(publishProblems({ title: 't', setting: 'x'.repeat(20), opening: 'o', castCount: 1 })).toEqual([]);
  });

  it('공개 범위: 만든 사람은 늘 보고, 남은 발행·공개·안 내려간 것만 본다', () => {
    const w = { ownerId: 'me', published: true, visibility: CharacterVisibility.PUBLIC, takenDownAt: null };
    expect(canView(w, 'other')).toBe(true);
    expect(canView({ ...w, visibility: CharacterVisibility.UNLISTED }, null)).toBe(true);
    expect(canView({ ...w, visibility: CharacterVisibility.PRIVATE }, 'other')).toBe(false);
    expect(canView({ ...w, published: false }, 'other')).toBe(false);
    expect(canView({ ...w, takenDownAt: new Date() }, 'other')).toBe(false);
    expect(canView({ ...w, takenDownAt: new Date(), published: false }, 'me')).toBe(true);
  });
});

describe('이벤트 설정과 보상', () => {
  it('보상: 승리 20~50, 패배 5~10', () => {
    for (let i = 0; i < 200; i++) {
      const win = rewardFor(true, random);
      const loss = rewardFor(false, random);
      expect(win).toBeGreaterThanOrEqual(20);
      expect(win).toBeLessThanOrEqual(50);
      expect(loss).toBeGreaterThanOrEqual(5);
      expect(loss).toBeLessThanOrEqual(10);
    }
  });

  it('운영 설정은 범위를 검사하고 빠진 값은 그대로 둔다', () => {
    expect(parseWorldSettings({ dailyRewardCap: 5 })).toEqual({ ...DEFAULT_WORLD_SETTINGS, dailyRewardCap: 5 });
    expect(() => parseWorldSettings({ dailyRewardCap: 1.5 })).toThrow('정수');
    expect(() => parseWorldSettings({ eventChance: 2 })).toThrow('0~1');
  });

  it('이벤트는 간격을 채우고 열린 것이 없고 확률에 걸릴 때만', () => {
    const s = DEFAULT_WORLD_SETTINGS;
    expect(shouldStartEvent(6, false, s, 0.1)).toBe(true);
    expect(shouldStartEvent(5, false, s, 0.1)).toBe(false);
    expect(shouldStartEvent(6, true, s, 0.1)).toBe(false);
    expect(shouldStartEvent(6, false, s, 0.9)).toBe(false);
  });
});

describe('미니게임 판정', () => {
  it('사다리: 같은 줄에 붙은 가로줄이 없고, 출발점마다 도착점이 다르다', () => {
    for (let t = 0; t < 50; t++) {
      const { rungs } = makeLadder(random);
      for (const [r, l] of rungs) expect(rungs.some(([r2, l2]) => r2 === r && l2 === l + 1)).toBe(false);
      const ends = new Set(Array.from({ length: LADDER_LANES }, (_, i) => ladderEnd(i, rungs)));
      expect(ends.size).toBe(LADDER_LANES);
    }
    expect(ladderEnd(0, [[0, 0]])).toBe(1);
    expect(ladderEnd(1, [[0, 0]])).toBe(0);
  });

  it('사다리·제비뽑기: 고른 것이 당첨이면 승리, 범위 밖은 거절', () => {
    const ladder = { kind: 'LADDER' as const, rungs: [] as [number, number][], prize: 2 };
    expect(resolveEvent(ladder, { choice: 2 }, random, 0).won).toBe(true);
    expect(resolveEvent(ladder, { choice: 1 }, random, 0).won).toBe(false);
    expect(() => resolveEvent(ladder, { choice: 9 }, random, 0)).toThrow('사다리');
    const lottery = { kind: 'LOTTERY' as const, straws: 5, winners: [1, 3] };
    expect(resolveEvent(lottery, { choice: 3 }, random, 0).won).toBe(true);
    expect(resolveEvent(lottery, { choice: 0 }, random, 0).won).toBe(false);
  });

  it('주사위: 비기면 다시 굴리고 합이 크면 승리', () => {
    // 첫 판 7:7 비김 → 둘째 판 12:2
    const r = resolveEvent({ kind: 'DICE' }, {}, seq(2, 3, 3, 2, 5, 5, 0, 0), 0);
    expect(r.outcome).toEqual({ me: [6, 6], host: [1, 1] });
    expect(r.won).toBe(true);
  });

  it('볼링: 커브에 맞춰 적당한 세기면 8핀 이상', () => {
    const lane = { kind: 'BOWLING' as const, curve: 0.3 };
    expect(resolveEvent(lane, { aim: 0.3, power: 0.75 }, seq(0), 0)).toMatchObject({ won: true, outcome: { pins: 10 } });
    expect(resolveEvent(lane, { aim: -1, power: 0 }, seq(0), 0).won).toBe(false);
  });

  it('미로: 만든 미로는 출구까지 길이 있고, 벽을 뚫으면 실패, 시간 넘기면 실패', () => {
    const cells = makeMaze(MAZE_SIZE, random);
    // 너비 우선으로 길 찾기
    const path = (() => {
      const prev = new Map<number, [number, string]>();
      const q = [0];
      const seen = new Set([0]);
      while (q.length) {
        const cur = q.shift()!;
        if (cur === MAZE_SIZE * MAZE_SIZE - 1) break;
        const x = cur % MAZE_SIZE;
        const y = Math.floor(cur / MAZE_SIZE);
        for (const [d, dx, dy] of [['U', 0, -1], ['R', 1, 0], ['D', 0, 1], ['L', -1, 0]] as const) {
          if (cells[cur] & WALL[d]) continue;
          const n = (y + dy) * MAZE_SIZE + (x + dx);
          if (seen.has(n)) continue;
          seen.add(n);
          prev.set(n, [cur, d]);
          q.push(n);
        }
      }
      let at = MAZE_SIZE * MAZE_SIZE - 1;
      let moves = '';
      while (at !== 0) {
        const [p, d] = prev.get(at)!;
        moves = d + moves;
        at = p;
      }
      return moves;
    })();
    const setup = { kind: 'MAZE' as const, size: MAZE_SIZE, cells, timeLimitS: 90 };
    expect(resolveEvent(setup, { moves: path }, random, 30_000).won).toBe(true);
    expect(resolveEvent(setup, { moves: path }, random, 200_000).won).toBe(false);
    expect(walkMaze(cells, MAZE_SIZE, 'L').ok).toBe(false);
    expect(walkMaze(cells, MAZE_SIZE, 'XYZ').ok).toBe(false);
  });

  it('화면에는 숨긴 값을 보내지 않는다', () => {
    expect(publicView(makeSetup('LADDER', random))).toEqual({ lanes: LADDER_LANES });
    expect(publicView(makeSetup('LOTTERY', random))).toEqual({ straws: 5 });
    expect(publicView(makeSetup('BOWLING', random))).not.toHaveProperty('curve');
    const lottery = makeSetup('LOTTERY', random);
    expect(lottery.kind === 'LOTTERY' && new Set(lottery.winners).size).toBe(2);
  });
});

describe('기타', () => {
  it('진행자 답을 조각으로 나눈다 (명단 밖 이름은 서술)', () => {
    expect(segments('@: 바람이 분다\n한서린: "안녕"\n낯선이: 흠\n그냥 문장', ['한서린'])).toEqual([
      { kind: 'narration', speaker: null, text: '바람이 분다' },
      { kind: 'line', speaker: '한서린', text: '"안녕"' },
      { kind: 'narration', speaker: null, text: '낯선이: 흠' },
      { kind: 'narration', speaker: null, text: '그냥 문장' },
    ]);
  });

  it('이벤트 결과 한 줄과 한국 날짜', () => {
    expect(eventNote('DICE', true, 30, true, '이안')).toBe('이안이(가) 갑자기 열린 주사위 대결에 참여해 이겼다 (보상 30 코레딧)');
    expect(eventNote('MAZE', false, 0, false, '이안')).toContain('아쉽게 졌다');
    expect(kstDay(new Date('2026-11-06T15:30:00Z'))).toBe('2026-11-07');
  });
});
