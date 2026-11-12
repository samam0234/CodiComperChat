// 월드코퍼챗 (2026-11-06): 세계관 문서 검증, 공개 범위, 이벤트 미니게임 판정. 순수 함수만 둔다(시험하기 쉽게).
// 미니게임 결과는 전부 서버가 정한다 — 화면에는 고를 것만 보내고, 숨긴 값(당첨 위치·커브·미로 출구 판정)은 setup에만 둔다.
import { BadRequestException } from '@nestjs/common';
import { josa } from '../../core/common/korean-josa.js';
import { CharacterVisibility, WorldEventKind, WorldMode } from '@prisma/client';

export const WORLD_LIMITS = {
  title: 40,
  oneLiner: 120,
  setting: 4000,
  rules: 2000,
  opening: 1000,
  cast: 12,
  castName: 20,
  castSummary: 600,
  castSpeech: 200,
  places: 30,
  placeName: 30,
  placeNote: 200,
  parts: 12,
  partTitle: 40,
  partGoal: 600,
  partOpening: 600,
  images: 40,
  imageLabel: 30,
} as const;

// 장면 그림·지도는 초상보다 크게 받는다(본문 파서 한도 300kb 안)
export const WORLD_IMAGE_MAX_BYTES = 290_000;

export const WORLD_MODES: Record<WorldMode, { api: 'chat' | 'visual_novel' | 'novel' | 'messenger'; label: string }> = {
  CHAT: { api: 'chat', label: '기본 채팅형' },
  VISUAL_NOVEL: { api: 'visual_novel', label: '비주얼노벨형' },
  NOVEL: { api: 'novel', label: '소설형' },
  MESSENGER: { api: 'messenger', label: '메신저형' },
};

export type CastInput = { name: string; summary: string; speech: string; startPlace: string; homePlace: string; characterId: string | null };
export type PlaceInput = { name: string; x: number; y: number; note: string };
export type PartInput = { title: string; goal: string; opening: string };
export type WorldDocument = {
  title: string;
  oneLiner: string;
  setting: string;
  rules: string;
  opening: string;
  mode: WorldMode;
  cast: CastInput[];
  places: PlaceInput[];
  parts: PartInput[];
};

const text = (v: unknown, max: number, label: string): string => {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') throw new BadRequestException(`${josa(label, '은/는')} 글이어야 해요.`);
  const t = v.trim();
  if (t.length > max) throw new BadRequestException(`${josa(label, '은/는')} ${max}자 이하로 써 주세요.`);
  return t;
};
const list = (v: unknown, max: number, label: string): unknown[] => {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new BadRequestException(`${label} 목록 형식이 맞지 않아요.`);
  if (v.length > max) throw new BadRequestException(`${josa(label, '은/는')} ${max}개까지예요.`);
  return v;
};
const record = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const percent = (v: unknown, label: string): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new BadRequestException(`${label} 좌표는 0~100 사이여야 해요.`);
  return Math.round(n * 10) / 10;
};
const unique = (names: string[], label: string) => {
  const seen = new Set<string>();
  for (const n of names) {
    if (seen.has(n)) throw new BadRequestException(`${label} 이름 ${josa(`"${n}"`, '이/가')} 겹쳐요.`);
    seen.add(n);
  }
};

// 편집기에서 보낸 세계관 문서를 검사한다. 저장은 덜 쓴 상태도 되고, 발행할 때 더 엄격하게 본다(canPublish)
export function parseWorldDocument(raw: unknown): WorldDocument {
  const o = record(raw);
  const L = WORLD_LIMITS;
  const modeRaw = typeof o.mode === 'string' ? o.mode.toUpperCase() : 'CHAT';
  if (!(modeRaw in WORLD_MODES)) throw new BadRequestException('대화 방식이 올바르지 않아요.');
  const places: PlaceInput[] = list(o.places, L.places, '장소').map((p, i) => {
    const r = record(p);
    const name = text(r.name, L.placeName, `장소 ${i + 1} 이름`);
    if (!name) throw new BadRequestException(`장소 ${i + 1}의 이름을 써 주세요.`);
    return { name, x: percent(r.x, name), y: percent(r.y, name), note: text(r.note, L.placeNote, `${name} 설명`) };
  });
  unique(places.map((p) => p.name), '장소');
  const placeNames = new Set(places.map((p) => p.name));
  const place = (v: unknown, who: string, label: string) => {
    const name = text(v, L.placeName, `${who} ${label}`);
    if (name && !placeNames.has(name)) throw new BadRequestException(`${who}의 ${label} ${josa(`"${name}"`, '이/가')} 장소 목록에 없어요.`);
    return name;
  };
  const cast: CastInput[] = list(o.cast, L.cast, '등장인물').map((c, i) => {
    const r = record(c);
    const name = text(r.name, L.castName, `등장인물 ${i + 1} 이름`);
    if (!name) throw new BadRequestException(`등장인물 ${i + 1}의 이름을 써 주세요.`);
    return {
      name,
      summary: text(r.summary, L.castSummary, `${name} 소개`),
      speech: text(r.speech, L.castSpeech, `${name} 말투`),
      startPlace: place(r.startPlace, name, '처음 있는 곳'),
      homePlace: place(r.homePlace, name, '사는 곳'),
      characterId: typeof r.characterId === 'string' && r.characterId ? r.characterId : null,
    };
  });
  unique(cast.map((c) => c.name), '등장인물');
  const parts: PartInput[] = list(o.parts, L.parts, '파트').map((p, i) => {
    const r = record(p);
    const title = text(r.title, L.partTitle, `파트 ${i + 1} 제목`);
    const goal = text(r.goal, L.partGoal, `파트 ${i + 1} 목표`);
    if (!title || !goal) throw new BadRequestException(`파트 ${i + 1}의 제목과 목표를 모두 써 주세요.`);
    return { title, goal, opening: text(r.opening, L.partOpening, `파트 ${i + 1} 시작 글`) };
  });
  return {
    title: text(o.title, L.title, '제목'),
    oneLiner: text(o.oneLiner, L.oneLiner, '한 줄 소개'),
    setting: text(o.setting, L.setting, '세계관 설명'),
    rules: text(o.rules, L.rules, '세계 규칙'),
    opening: text(o.opening, L.opening, '첫 장면'),
    mode: modeRaw as WorldMode,
    cast,
    places,
    parts,
  };
}

// 발행 조건. 빠진 것을 사람 말로 돌려준다(없으면 빈 목록)
export function publishProblems(doc: Pick<WorldDocument, 'title' | 'setting' | 'opening'> & { castCount: number }): string[] {
  const problems: string[] = [];
  if (!doc.title) problems.push('제목');
  if (doc.setting.length < 20) problems.push('세계관 설명(20자 이상)');
  if (!doc.opening) problems.push('첫 장면');
  if (doc.castCount < 1) problems.push('등장인물 1명 이상');
  return problems;
}

// 남이 볼 수 있나 (만든 사람은 발행 전·비공개도 본다. 운영자가 내린 세계관은 만든 사람만 사유와 함께 본다)
export function canView(
  world: { ownerId: string | null; published: boolean; visibility: CharacterVisibility; takenDownAt: Date | null },
  viewerId: string | null,
): boolean {
  if (viewerId && world.ownerId === viewerId) return true;
  if (world.takenDownAt) return false;
  return world.published && world.visibility !== CharacterVisibility.PRIVATE;
}

export const parseVisibility = (v: unknown): CharacterVisibility => {
  const s = typeof v === 'string' ? v.toUpperCase() : '';
  if (s === 'PUBLIC' || s === 'UNLISTED' || s === 'PRIVATE') return s as CharacterVisibility;
  throw new BadRequestException('공개 범위는 PUBLIC · UNLISTED · PRIVATE 중 하나예요.');
};

// ─── 이벤트 미니게임 ───────────────────────────────────────────

export type Rng = (maxExclusive: number) => number;

export const EVENT_LABELS: Record<WorldEventKind, string> = {
  LADDER: '사다리 게임',
  DICE: '주사위 대결',
  BOWLING: '미니 볼링',
  LOTTERY: '제비뽑기',
  MAZE: '미로 찾기',
};
export const EVENT_TTL_MS = 10 * 60_000;
export const MAZE_SIZE = 7;
export const MAZE_TIME_LIMIT_S = 90;
// 승리 20~50 (최대 50), 패배 참여 보상 5~10
export const WIN_REWARD = { min: 20, max: 50 } as const;
export const LOSS_REWARD = { min: 5, max: 10 } as const;
export const rewardFor = (won: boolean, rng: Rng): number => {
  const r = won ? WIN_REWARD : LOSS_REWARD;
  return r.min + rng(r.max - r.min + 1);
};

export type WorldSettings = { dailyRewardCap: number; eventChance: number; eventMinTurns: number };
export const DEFAULT_WORLD_SETTINGS: WorldSettings = { dailyRewardCap: 3, eventChance: 0.35, eventMinTurns: 6 };

export function parseWorldSettings(raw: unknown, base: WorldSettings = DEFAULT_WORLD_SETTINGS): WorldSettings {
  const o = record(raw);
  const int = (v: unknown, fallback: number, min: number, max: number, label: string) => {
    if (v === undefined) return fallback;
    const n = Number(v);
    if (!Number.isInteger(n) || n < min || n > max) throw new BadRequestException(`${josa(label, '은/는')} ${min}~${max} 사이 정수예요.`);
    return n;
  };
  const chance = o.eventChance === undefined ? base.eventChance : Number(o.eventChance);
  if (!Number.isFinite(chance) || chance < 0 || chance > 1) throw new BadRequestException('이벤트 확률은 0~1 사이예요.');
  return {
    dailyRewardCap: int(o.dailyRewardCap, base.dailyRewardCap, 0, 20, '하루 보상 횟수'),
    eventChance: Math.round(chance * 100) / 100,
    eventMinTurns: int(o.eventMinTurns, base.eventMinTurns, 1, 100, '이벤트 최소 간격(턴)'),
  };
}

// 이번 턴에 이벤트를 띄우나 (열린 이벤트가 없고, 간격을 채웠고, 확률에 걸렸을 때)
export const shouldStartEvent = (turnsSinceEvent: number, hasOpen: boolean, s: WorldSettings, roll: number): boolean =>
  !hasOpen && turnsSinceEvent >= s.eventMinTurns && roll < s.eventChance;

// 사다리: 가로줄 [row, lane] — lane과 lane+1을 잇는다. 같은 줄에 붙은 가로줄은 두지 않는다
export type Rung = [number, number];
export const LADDER_LANES = 4;
export const LADDER_ROWS = 10;
export function makeLadder(rng: Rng): { rungs: Rung[]; prize: number } {
  const rungs: Rung[] = [];
  for (let row = 0; row < LADDER_ROWS; row++) {
    for (let lane = 0; lane < LADDER_LANES - 1; lane++) {
      const blocked = rungs.some(([r, l]) => r === row && Math.abs(l - lane) <= 1);
      if (!blocked && rng(100) < 45) rungs.push([row, lane]);
    }
  }
  return { rungs, prize: rng(LADDER_LANES) };
}
export function ladderEnd(start: number, rungs: Rung[]): number {
  let lane = start;
  for (let row = 0; row < LADDER_ROWS; row++) {
    if (rungs.some(([r, l]) => r === row && l === lane)) lane += 1;
    else if (rungs.some(([r, l]) => r === row && l === lane - 1)) lane -= 1;
  }
  return lane;
}

// 미로: 칸마다 막힌 벽 비트 (위 1, 오른쪽 2, 아래 4, 왼쪽 8). 깊이 우선으로 만든 완전 미로(출구까지 길이 하나)
export const WALL = { U: 1, R: 2, D: 4, L: 8 } as const;
const STEP: Record<keyof typeof WALL, [number, number, keyof typeof WALL]> = { U: [0, -1, 'D'], R: [1, 0, 'L'], D: [0, 1, 'U'], L: [-1, 0, 'R'] };
export function makeMaze(size: number, rng: Rng): number[] {
  const cells = Array<number>(size * size).fill(15);
  const seen = new Set<number>([0]);
  const stack = [0];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const x = cur % size;
    const y = Math.floor(cur / size);
    const options = (Object.keys(STEP) as (keyof typeof WALL)[]).filter((d) => {
      const [dx, dy] = STEP[d];
      const nx = x + dx;
      const ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < size && ny < size && !seen.has(ny * size + nx);
    });
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const d = options[rng(options.length)];
    const [dx, dy, back] = STEP[d];
    const next = (y + dy) * size + (x + dx);
    cells[cur] &= ~WALL[d];
    cells[next] &= ~WALL[back];
    seen.add(next);
    stack.push(next);
  }
  return cells;
}
// 이동 문자열(U/R/D/L)을 따라간다. 벽을 뚫거나 밖으로 나가면 실패, 끝 칸에 닿으면 성공
export function walkMaze(cells: number[], size: number, moves: string): { ok: boolean; reached: boolean; steps: number } {
  if (!/^[URDL]{0,400}$/.test(moves)) return { ok: false, reached: false, steps: 0 };
  let x = 0;
  let y = 0;
  let steps = 0;
  for (const m of moves as Iterable<keyof typeof WALL>) {
    if (cells[y * size + x] & WALL[m]) return { ok: false, reached: false, steps };
    x += STEP[m][0];
    y += STEP[m][1];
    steps += 1;
    if (x === size - 1 && y === size - 1) return { ok: true, reached: true, steps };
  }
  return { ok: true, reached: false, steps };
}

export type EventSetup =
  | { kind: 'LADDER'; rungs: Rung[]; prize: number }
  | { kind: 'DICE' }
  | { kind: 'BOWLING'; curve: number }
  | { kind: 'LOTTERY'; straws: number; winners: number[] }
  | { kind: 'MAZE'; size: number; cells: number[]; timeLimitS: number };

export function makeSetup(kind: WorldEventKind, rng: Rng): EventSetup {
  switch (kind) {
    case 'LADDER':
      return { kind, ...makeLadder(rng) };
    case 'DICE':
      return { kind };
    case 'BOWLING':
      // 레인의 휘는 정도 (-0.6~0.6). 화면에는 힌트로 방향만 보여 준다
      return { kind, curve: (rng(121) - 60) / 100 };
    case 'LOTTERY': {
      const first = rng(5);
      let second = rng(4);
      if (second >= first) second += 1;
      return { kind, straws: 5, winners: [first, second].sort() };
    }
    case 'MAZE':
      return { kind, size: MAZE_SIZE, cells: makeMaze(MAZE_SIZE, rng), timeLimitS: MAZE_TIME_LIMIT_S };
  }
}

// 화면에 보낼 것 (숨긴 값은 빼고)
export function publicView(setup: EventSetup): Record<string, unknown> {
  switch (setup.kind) {
    case 'LADDER':
      return { lanes: LADDER_LANES };
    case 'DICE':
      return {};
    case 'BOWLING':
      return { hint: setup.curve > 0.15 ? '레인이 오른쪽으로 살짝 휘어 있다' : setup.curve < -0.15 ? '레인이 왼쪽으로 살짝 휘어 있다' : '레인이 곧다' };
    case 'LOTTERY':
      return { straws: setup.straws };
    case 'MAZE':
      return { size: setup.size, cells: setup.cells, timeLimitS: setup.timeLimitS };
  }
}

const num = (v: unknown, label: string): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) throw new BadRequestException(`${label} 값이 올바르지 않아요.`);
  return n;
};

// 판정. elapsedMs: 이벤트가 뜬 뒤 지난 시간(미로 시간 제한)
export function resolveEvent(setup: EventSetup, input: unknown, rng: Rng, elapsedMs: number): { won: boolean; outcome: Record<string, unknown> } {
  const o = record(input);
  switch (setup.kind) {
    case 'LADDER': {
      const choice = num(o.choice, '고른 줄');
      if (!Number.isInteger(choice) || choice < 0 || choice >= LADDER_LANES) throw new BadRequestException('사다리 줄을 골라 주세요.');
      const end = ladderEnd(choice, setup.rungs);
      return { won: end === setup.prize, outcome: { choice, end, prize: setup.prize, rungs: setup.rungs } };
    }
    case 'DICE': {
      let me: [number, number] = [1, 1];
      let host: [number, number] = [1, 1];
      for (let i = 0; i < 10; i++) {
        me = [rng(6) + 1, rng(6) + 1];
        host = [rng(6) + 1, rng(6) + 1];
        if (me[0] + me[1] !== host[0] + host[1]) break;
      }
      return { won: me[0] + me[1] > host[0] + host[1], outcome: { me, host } };
    }
    case 'BOWLING': {
      const aim = Math.max(-1, Math.min(1, num(o.aim, '방향')));
      const power = Math.max(0, Math.min(1, num(o.power, '세기')));
      const pins = Math.max(0, Math.min(10, Math.round(10 - Math.abs(aim - setup.curve) * 12 - Math.abs(power - 0.75) * 8 - rng(3))));
      return { won: pins >= 8, outcome: { aim, power, pins, curve: setup.curve } };
    }
    case 'LOTTERY': {
      const choice = num(o.choice, '고른 제비');
      if (!Number.isInteger(choice) || choice < 0 || choice >= setup.straws) throw new BadRequestException('제비를 하나 골라 주세요.');
      return { won: setup.winners.includes(choice), outcome: { choice, winners: setup.winners } };
    }
    case 'MAZE': {
      const moves = typeof o.moves === 'string' ? o.moves : '';
      const walk = walkMaze(setup.cells, setup.size, moves);
      const inTime = elapsedMs <= (setup.timeLimitS + 5) * 1000;
      return { won: walk.ok && walk.reached && inTime, outcome: { steps: walk.steps, reached: walk.reached, valid: walk.ok, inTime } };
    }
  }
}

// 이벤트가 끝난 뒤 진행자에게 줄 한 줄
export function eventNote(kind: WorldEventKind, won: boolean, reward: number, rewarded: boolean, userName: string): string {
  const result = won ? '이겼다' : '아쉽게 졌다';
  const prize = rewarded ? ` (보상 ${reward} 코레딧)` : '';
  return `${josa(userName, '이/가')} 갑자기 열린 ${EVENT_LABELS[kind]}에 참여해 ${result}${prize}`;
}

// 한국 시각 날짜 (YYYY-MM-DD)
export const kstDay = (now: Date = new Date()): string => new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);

// 진행자 답을 화면 조각으로 나눈다: "@: 서술" · "이름: 말" · 나머지(서술). 소설형은 문단 그대로
export type Segment = { kind: 'narration' | 'line'; speaker: string | null; text: string };
export function segments(reply: string, names: string[]): Segment[] {
  const known = new Set(names);
  return reply
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): Segment => {
      if (/^@\s*[:：]?/.test(line) && line.startsWith('@')) return { kind: 'narration', speaker: null, text: line.replace(/^@\s*[:：]?\s*/, '') };
      const m = /^([^\s:：*"“]{1,20})\s*[:：]\s*(.+)$/.exec(line);
      if (m && known.has(m[1])) return { kind: 'line', speaker: m[1], text: m[2] };
      return { kind: 'narration', speaker: null, text: line };
    });
}
