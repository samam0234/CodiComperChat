import { randomInt } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreditReason, MessageRole, PortraitReview, WorldEventStatus, type Prisma, type WorldEventKind } from '@prisma/client';
import { adultBlock } from '../../account/account/adult.js';
import { particle } from '../../core/common/korean-josa.js';
import { noticeScene } from '../../chat/character-chat/scene.js';
import { postToAi } from '../../chat/ai/ai-client.js';
import { DEFAULT_MODEL_ID, findModel } from '../../billing/models/models.js';
import { ModelsService } from '../../billing/models/models.service.js';
import { PersonasService } from '../../chat/personas/personas.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { WorldSettingsService } from '../settings/world-settings.service.js';
import {
  EVENT_LABELS,
  EVENT_TTL_MS,
  WORLD_MODES,
  canView,
  eventNote,
  kstDay,
  makeSetup,
  publicView,
  resolveEvent,
  rewardFor,
  segments,
  shouldStartEvent,
  type EventSetup,
} from '../document/world.js';

export const WORLD_TURN_MAX = 1000;
// 입력 없이 보내기: 진행자에게만 보이고, 화면의 주인공 말로는 저장하지 않는다
export const WORLD_PREDICT_TURN =
  '(주인공은 이번 턴에 아무 말도 하지 않았다. 지금까지의 장면과 대화를 보고 다음에 이어질 일을 예상하고 분석한 뒤, 등장인물이 그 흐름에 맞춰 한 걸음 진행하게 해 줘. 주인공의 대사와 속마음은 쓰지 마.)';
// 진행자에게 넘기는 최근 대화 수, 파트 판정에 보는 대화 수, 몇 턴마다 파트를 판정하나
const RECENT = 16;
const PART_WINDOW = 12;
export const PART_CHECK_EVERY = 3;
const HISTORY = 80;
const STORY_MAX = 1200;
const KINDS: WorldEventKind[] = ['LADDER', 'DICE', 'BOWLING', 'LOTTERY', 'MAZE'];
const rng = (max: number) => randomInt(max);

const PLAY_WORLD = {
  id: true,
  ownerId: true,
  title: true,
  setting: true,
  rules: true,
  opening: true,
  mode: true,
  published: true,
  visibility: true,
  takenDownAt: true,
  mapMime: true,
  mapReview: true,
  cast: { orderBy: { order: 'asc' }, select: { name: true, summary: true, speech: true, startPlace: true, homePlace: true } },
  places: { orderBy: { order: 'asc' }, select: { name: true, x: true, y: true, note: true } },
  parts: { orderBy: { order: 'asc' }, select: { title: true, goal: true, opening: true } },
  images: { where: { review: PortraitReview.APPROVED, blockedAt: null }, select: { id: true, label: true, character: true } },
} as const;
type PlayWorld = Prisma.WorldGetPayload<{ select: typeof PLAY_WORLD }>;

type Locations = Record<string, string>;
const asLocations = (v: unknown): Locations =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === 'string'))
    : {};

// 월드코퍼챗 플레이: 시작·진행·파트 넘기기·이벤트 미니게임
@Injectable()
export class WorldPlayService {
  private readonly logger = new Logger('WorldPlay');

  constructor(
    private readonly prisma: PrismaService,
    private readonly models: ModelsService,
    private readonly personas: PersonasService,
    private readonly settings: WorldSettingsService,
  ) {}

  private async world(viewerId: string, id: string): Promise<PlayWorld> {
    const world = await this.prisma.world.findUnique({ where: { id }, select: PLAY_WORLD });
    if (!world || !canView(world, viewerId)) throw new NotFoundException('세계관을 찾을 수 없어요.');
    return world;
  }

  private async play(userId: string, worldId: string) {
    return this.prisma.worldPlay.findUnique({ where: { userId_worldId: { userId, worldId } } });
  }

  // 성인 확인을 마친 계정인가 (매 턴 DB로 다시 본다)
  private async adult(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true, adultConsentAt: true, emailVerifiedAt: true } });
    return user !== null && adultBlock(user) === null;
  }

  // 시작 (이미 하고 있으면 그대로, restart면 지우고 처음부터)
  async start(userId: string, id: string, personaId: unknown, restart: boolean) {
    const world = await this.world(userId, id);
    const existing = await this.play(userId, id);
    if (existing && !restart) return this.state(userId, id);
    if (typeof personaId !== 'string' || !personaId) throw new BadRequestException('플레이할 내 프로필을 골라 주세요.');
    const persona = await this.personas.findOwned(userId, personaId);
    if (existing) await this.prisma.worldPlay.delete({ where: { id: existing.id } });
    const locations: Locations = {};
    for (const c of world.cast) if (c.startPlace || c.homePlace) locations[c.name] = c.startPlace || c.homePlace;
    const messages: { role: MessageRole; content: string }[] = [];
    if (world.opening) messages.push({ role: MessageRole.CHARACTER, content: world.opening });
    const first = world.parts[0];
    if (first) {
      messages.push({ role: MessageRole.SYSTEM, content: `1부 · ${first.title}` });
      if (first.opening) messages.push({ role: MessageRole.CHARACTER, content: `@: ${first.opening}` });
    }
    const now = Date.now();
    await this.prisma.worldPlay.create({
      data: {
        userId,
        worldId: id,
        personaName: persona.name,
        personaDescription: persona.description ?? '',
        locations,
        // 시작 글들의 순서를 지키도록 1ms씩 띄운다
        messages: { create: messages.map((m, i) => ({ ...m, createdAt: new Date(now + i) })) },
      },
    });
    return this.state(userId, id);
  }

  async state(userId: string, id: string) {
    const world = await this.world(userId, id);
    const play = await this.play(userId, id);
    const settings = await this.settings.get();
    const base = {
      world: {
        id: world.id,
        title: world.title,
        mode: world.mode,
        modeLabel: WORLD_MODES[world.mode].label,
        cast: world.cast.map((c) => ({ name: c.name, summary: c.summary, homePlace: c.homePlace })),
        places: world.places,
        partTitles: world.parts.map((p) => p.title),
        images: world.images.map((i) => ({ id: i.id, label: i.label, character: i.character })),
        hasMap: world.mapMime !== null && (world.mapReview === PortraitReview.APPROVED || world.ownerId === userId),
        mine: world.ownerId === userId,
      },
      dailyRewardCap: settings.dailyRewardCap,
    };
    if (!play) return { ...base, play: null };
    const names = world.cast.map((c) => c.name);
    const [messages, open, rewardedToday] = await Promise.all([
      this.prisma.worldMessage.findMany({ where: { playId: play.id }, orderBy: { createdAt: 'desc' }, take: HISTORY }),
      this.openEvent(play.id),
      this.rewardedToday(userId),
    ]);
    return {
      ...base,
      rewardedToday,
      play: {
        id: play.id,
        persona: { name: play.personaName, description: play.personaDescription },
        partIndex: play.partIndex,
        finished: play.finished,
        turns: play.turns,
        locations: asLocations(play.locations),
        sceneTime: play.sceneTime,
        scenePlace: play.scenePlace,
        messages: messages.reverse().map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          imageId: m.imageId,
          createdAt: m.createdAt,
          segments: m.role === MessageRole.CHARACTER ? segments(m.content, names) : null,
        })),
        event: open ? this.presentEvent(open) : null,
      },
    };
  }

  private async openEvent(playId: string) {
    const open = await this.prisma.worldEvent.findFirst({ where: { playId, status: WorldEventStatus.OPEN }, orderBy: { createdAt: 'desc' } });
    if (open && Date.now() - open.createdAt.getTime() > EVENT_TTL_MS) {
      await this.prisma.worldEvent.updateMany({ where: { id: open.id, status: WorldEventStatus.OPEN }, data: { status: WorldEventStatus.EXPIRED, resolvedAt: new Date() } });
      return null;
    }
    return open;
  }

  private rewardedToday(userId: string) {
    return this.prisma.worldEvent.count({ where: { userId, rewardDay: kstDay(), rewarded: true } });
  }

  private presentEvent(e: { id: string; kind: WorldEventKind; status: WorldEventStatus; setup: Prisma.JsonValue; createdAt: Date }) {
    return {
      id: e.id,
      kind: e.kind,
      label: EVENT_LABELS[e.kind],
      status: e.status,
      view: publicView(e.setup as unknown as EventSetup),
      expiresAt: new Date(e.createdAt.getTime() + EVENT_TTL_MS),
    };
  }

  // 한 턴: 진행자 답 → 장소 이동 반영 → (3턴마다) 파트 판정 → (확률로) 이벤트
  async turn(userId: string, id: string, textRaw: unknown) {
    const text = typeof textRaw === 'string' ? textRaw.trim() : '';
    const predicted = text === '';
    if (text.length > WORLD_TURN_MAX) throw new BadRequestException(`한 번에 ${WORLD_TURN_MAX}자까지 보낼 수 있어요.`);
    const world = await this.world(userId, id);
    const play = await this.play(userId, id);
    if (!play) throw new ConflictException('먼저 플레이를 시작해 주세요.');

    // 이벤트를 남겨 두고 이야기를 이어 가면 그 이벤트는 끝난 것으로 본다(보상 없음)
    await this.prisma.worldEvent.updateMany({ where: { playId: play.id, status: WorldEventStatus.OPEN }, data: { status: WorldEventStatus.EXPIRED, resolvedAt: new Date() } });

    const recent = await this.prisma.worldMessage.findMany({
      where: { playId: play.id, role: { in: [MessageRole.USER, MessageRole.CHARACTER] } },
      orderBy: { createdAt: 'desc' },
      take: RECENT,
    });
    const locations = asLocations(play.locations);
    const part = !play.finished ? world.parts[play.partIndex] : undefined;
    const model = findModel(DEFAULT_MODEL_ID)!;
    const ticket = await this.models.reserve(userId, model);
    let result: { reply: string; image: string | null; moves: { name: string; place: string }[] };
    try {
      result = await postToAi('/world/turn', {
        world: { title: world.title, setting: world.setting, rules: world.rules, mode: WORLD_MODES[world.mode].api },
        part: part ? { title: part.title, goal: part.goal, opening: part.opening } : null,
        cast: world.cast.map((c) => ({ name: c.name, summary: c.summary, speech: c.speech, place: locations[c.name] ?? '' })),
        places: world.places.map((p) => p.name),
        images: world.images.map((i) => ({ label: i.label, character: i.character })),
        recentTurns: recent.reverse().map((m) => ({ role: m.role === MessageRole.USER ? 'user' : 'character', text: m.content })),
        storySoFar: play.storySoFar || null,
        userPersona: { name: play.personaName, description: play.personaDescription.slice(0, 300) },
        userTurn: predicted ? WORLD_PREDICT_TURN : text,
        adult: await this.adult(userId),
        eventNote: play.eventNote,
      });
    } catch (error) {
      await this.models.release(userId, ticket);
      throw error;
    }

    const imageId = result.image ? (world.images.find((i) => i.label === result.image)?.id ?? null) : null;
    const known = new Set(world.cast.map((c) => c.name));
    const places = new Set(world.places.map((p) => p.name));
    for (const move of result.moves ?? []) if (known.has(move.name) && places.has(move.place)) locations[move.name] = move.place;

    const now = Date.now();
    await this.prisma.worldMessage.createMany({
      data: predicted
        ? [{ playId: play.id, role: MessageRole.CHARACTER, content: result.reply, imageId, createdAt: new Date(now) }]
        : [
            { playId: play.id, role: MessageRole.USER, content: text, createdAt: new Date(now) },
            { playId: play.id, role: MessageRole.CHARACTER, content: result.reply, imageId, createdAt: new Date(now + 1) },
          ],
    });
    const turns = play.turns + 1;
    const scene = noticeScene(predicted ? result.reply : `${text}\n${result.reply}`, { time: play.sceneTime ?? null, place: play.scenePlace ?? null });
    const update: Prisma.WorldPlayUpdateInput = {
      turns,
      turnsSinceEvent: play.turnsSinceEvent + 1,
      eventNote: null,
      locations,
      sceneTime: scene.time,
      scenePlace: scene.place,
    };

    if (part && turns % PART_CHECK_EVERY === 0) {
      const advanced = await this.checkPart(play.id, play.personaName, play.storySoFar, part, play.partIndex, world.parts, now + 2);
      if (advanced) Object.assign(update, advanced);
    }

    const settings = await this.settings.get();
    if (shouldStartEvent(play.turnsSinceEvent + 1, false, settings, Math.random())) {
      const kind = KINDS[rng(KINDS.length)];
      await this.prisma.worldEvent.create({
        data: { playId: play.id, userId, kind, setup: makeSetup(kind, rng) as unknown as Prisma.InputJsonValue },
      });
      update.turnsSinceEvent = 0;
    }
    await this.prisma.worldPlay.update({ where: { id: play.id }, data: update });
    return this.state(userId, id);
  }

  // 파트 목표를 판정해 이루어졌으면 다음 파트로. 판정이 실패해도 이야기는 계속된다
  private async checkPart(
    playId: string,
    userName: string,
    storySoFar: string,
    part: { title: string; goal: string; opening: string },
    index: number,
    parts: { title: string; goal: string; opening: string }[],
    at: number,
  ): Promise<Prisma.WorldPlayUpdateInput | null> {
    const window = await this.prisma.worldMessage.findMany({
      where: { playId, role: { in: [MessageRole.USER, MessageRole.CHARACTER] } },
      orderBy: { createdAt: 'desc' },
      take: PART_WINDOW,
    });
    let check: { done: boolean; evidence: string };
    try {
      check = await postToAi('/world/part-check', {
        part: { title: part.title, goal: part.goal, opening: part.opening },
        turns: window.reverse().map((m) => ({ role: m.role === MessageRole.USER ? 'user' : 'character', text: m.content })),
        storySoFar: storySoFar || null,
        userName,
      });
    } catch (error) {
      this.logger.warn(`파트 판정 실패(이야기는 계속): ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
    if (!check.done) return null;
    const next = parts[index + 1];
    const messages: { playId: string; role: MessageRole; content: string; createdAt: Date }[] = [
      { playId, role: MessageRole.SYSTEM, content: `${index + 1}부 · ${part.title} 완료`, createdAt: new Date(at) },
    ];
    if (next) {
      messages.push({ playId, role: MessageRole.SYSTEM, content: `${index + 2}부 · ${next.title}`, createdAt: new Date(at + 1) });
      if (next.opening) messages.push({ playId, role: MessageRole.CHARACTER, content: `@: ${next.opening}`, createdAt: new Date(at + 2) });
    } else {
      messages.push({ playId, role: MessageRole.SYSTEM, content: '모든 파트를 마쳤어요. 이야기는 자유롭게 이어 갈 수 있어요.', createdAt: new Date(at + 1) });
    }
    await this.prisma.worldMessage.createMany({ data: messages });
    const story = `${storySoFar}\n- ${index + 1}부 「${part.title}」${particle(part.title, '을/를')} 마쳤다: ${check.evidence}`.trim().slice(-STORY_MAX);
    return { partIndex: index + 1, finished: !next, storySoFar: story };
  }

  // 이벤트 참여. 결과는 서버가 정하고, 하루 한도 안이면 코레딧을 준다 (한 계정의 보상은 한 줄씩 — 동시 요청도 한도를 넘지 않게 잠근다)
  async playEvent(userId: string, id: string, eventId: string, input: unknown) {
    await this.world(userId, id);
    const play = await this.play(userId, id);
    if (!play) throw new ConflictException('먼저 플레이를 시작해 주세요.');
    const event = await this.prisma.worldEvent.findFirst({ where: { id: eventId, playId: play.id } });
    if (!event) throw new NotFoundException('이벤트를 찾을 수 없어요.');
    if (event.status !== WorldEventStatus.OPEN) throw new ConflictException('이미 끝난 이벤트예요.');
    const elapsed = Date.now() - event.createdAt.getTime();
    if (elapsed > EVENT_TTL_MS) {
      await this.prisma.worldEvent.updateMany({ where: { id: event.id, status: WorldEventStatus.OPEN }, data: { status: WorldEventStatus.EXPIRED, resolvedAt: new Date() } });
      throw new ConflictException('시간이 지나 끝난 이벤트예요.');
    }
    const { won, outcome } = resolveEvent(event.setup as unknown as EventSetup, input, rng, elapsed);
    const reward = rewardFor(won, rng);
    const settings = await this.settings.get();
    const day = kstDay();

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`world-event:${userId}`}))`;
      const claimed = await tx.worldEvent.updateMany({
        where: { id: event.id, status: WorldEventStatus.OPEN },
        data: { status: won ? WorldEventStatus.WON : WorldEventStatus.LOST, outcome: outcome as Prisma.InputJsonValue, resolvedAt: new Date() },
      });
      if (claimed.count === 0) throw new ConflictException('이미 끝난 이벤트예요.');
      const used = await tx.worldEvent.count({ where: { userId, rewardDay: day, rewarded: true } });
      if (used >= settings.dailyRewardCap) return { rewarded: false, balance: null as number | null };
      await tx.worldEvent.update({ where: { id: event.id }, data: { reward, rewarded: true, rewardDay: day } });
      const user = await tx.user.update({ where: { id: userId }, data: { credits: { increment: reward } }, select: { credits: true } });
      await tx.creditLedger.create({
        data: { userId, delta: reward, balance: user.credits, reason: CreditReason.EVENT, modelId: `event:${event.kind.toLowerCase()}` },
      });
      return { rewarded: true, balance: user.credits };
    });

    await this.prisma.worldPlay.update({
      where: { id: play.id },
      data: { eventNote: eventNote(event.kind, won, reward, result.rewarded, play.personaName) },
    });
    return {
      id: event.id,
      kind: event.kind,
      label: EVENT_LABELS[event.kind],
      won,
      outcome,
      reward: result.rewarded ? reward : 0,
      rewarded: result.rewarded,
      balance: result.balance,
      rewardedToday: await this.rewardedToday(userId),
      dailyRewardCap: settings.dailyRewardCap,
    };
  }
}
