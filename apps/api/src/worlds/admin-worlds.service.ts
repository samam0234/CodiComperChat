import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CharacterVisibility, PortraitReview, WorldEventStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorldSettingsService } from './world-settings.service.js';
import { EVENT_LABELS, WORLD_MODES, kstDay } from './world.js';

const FILTERS: Record<string, Prisma.WorldWhereInput> = {
  all: {},
  public: { published: true, takenDownAt: null, visibility: CharacterVisibility.PUBLIC },
  unlisted: { published: true, takenDownAt: null, visibility: CharacterVisibility.UNLISTED },
  private: { published: true, takenDownAt: null, visibility: CharacterVisibility.PRIVATE },
  unpublished: { published: false, takenDownAt: null },
  'taken-down': { takenDownAt: { not: null } },
  'needs-review': { OR: [{ images: { some: { review: PortraitReview.PENDING, blockedAt: null } } }, { mapReview: PortraitReview.PENDING }] },
};

// 운영 콘솔: 세계관 목록·상세·내리기, 장면 그림·지도 검수, 이벤트 기록과 운영 설정
@Injectable()
export class AdminWorldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: WorldSettingsService,
  ) {}

  async stats() {
    const day = kstDay();
    const [worlds, published, takenDown, plays, pendingImages, pendingMaps, todayEvents, todayRewards] = await Promise.all([
      this.prisma.world.count(),
      this.prisma.world.count({ where: FILTERS.public }),
      this.prisma.world.count({ where: FILTERS['taken-down'] }),
      this.prisma.worldPlay.count(),
      this.prisma.worldImage.count({ where: { review: PortraitReview.PENDING, blockedAt: null } }),
      this.prisma.world.count({ where: { mapReview: PortraitReview.PENDING, mapMime: { not: null } } }),
      this.prisma.worldEvent.count({ where: { createdAt: { gte: new Date(`${day}T00:00:00+09:00`) } } }),
      this.prisma.worldEvent.aggregate({ where: { rewardDay: day, rewarded: true }, _sum: { reward: true }, _count: true }),
    ]);
    return {
      worlds,
      published,
      takenDown,
      plays,
      pendingReview: pendingImages + pendingMaps,
      today: { day, events: todayEvents, rewarded: todayRewards._count, credits: todayRewards._sum.reward ?? 0 },
    };
  }

  async list(opts: { q?: string; filter?: string; take?: string }) {
    const where: Prisma.WorldWhereInput = { ...FILTERS[opts.filter ?? 'all'] };
    const q = (opts.q ?? '').trim().slice(0, 60);
    if (q) {
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { oneLiner: { contains: q, mode: 'insensitive' } },
            { owner: { email: { contains: q, mode: 'insensitive' } } },
            { owner: { displayName: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }
    const take = Math.max(1, Math.min(200, Number(opts.take) || 100));
    const rows = await this.prisma.world.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        oneLiner: true,
        mode: true,
        visibility: true,
        published: true,
        takenDownAt: true,
        takedownReason: true,
        mapReview: true,
        mapMime: true,
        updatedAt: true,
        owner: { select: { id: true, email: true, displayName: true } },
        _count: { select: { cast: true, parts: true, plays: true, images: true } },
        images: { where: { review: PortraitReview.PENDING, blockedAt: null }, select: { id: true } },
      },
    });
    return rows.map(({ images, mapReview, mapMime, _count, ...w }) => ({
      ...w,
      modeLabel: WORLD_MODES[w.mode].label,
      counts: _count,
      pendingImages: images.length + (mapMime && mapReview === PortraitReview.PENDING ? 1 : 0),
    }));
  }

  async detail(id: string) {
    const world = await this.prisma.world.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        oneLiner: true,
        setting: true,
        rules: true,
        opening: true,
        mode: true,
        visibility: true,
        published: true,
        takenDownAt: true,
        takedownReason: true,
        mapMime: true,
        mapReview: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { id: true, email: true, displayName: true } },
        cast: { orderBy: { order: 'asc' }, select: { name: true, summary: true, speech: true, startPlace: true, homePlace: true, characterId: true } },
        places: { orderBy: { order: 'asc' }, select: { name: true, x: true, y: true, note: true } },
        parts: { orderBy: { order: 'asc' }, select: { title: true, goal: true, opening: true } },
        images: { orderBy: { createdAt: 'asc' }, select: { id: true, label: true, character: true, review: true, reviewNote: true, blockedAt: true, createdAt: true } },
        _count: { select: { plays: true } },
      },
    });
    if (!world) throw new NotFoundException('세계관을 찾을 수 없어요.');
    const [finished, events] = await Promise.all([
      this.prisma.worldPlay.count({ where: { worldId: id, finished: true } }),
      this.prisma.worldEvent.groupBy({ by: ['status'], where: { play: { worldId: id } }, _count: true }),
    ]);
    const { mapMime, _count, ...rest } = world;
    return {
      ...rest,
      modeLabel: WORLD_MODES[world.mode].label,
      hasMap: mapMime !== null,
      plays: { total: _count.plays, finished },
      events: Object.fromEntries(events.map((e) => [e.status, e._count])),
    };
  }

  async takedown(id: string, reasonRaw: unknown) {
    const reason = typeof reasonRaw === 'string' ? reasonRaw.trim().slice(0, 300) : '';
    if (!reason) throw new BadRequestException('내리는 사유를 써 주세요. 만든 사람에게 보입니다.');
    await this.exists(id);
    await this.prisma.world.update({ where: { id }, data: { takenDownAt: new Date(), takedownReason: reason } });
    return this.detail(id);
  }

  async restore(id: string) {
    await this.exists(id);
    await this.prisma.world.update({ where: { id }, data: { takenDownAt: null, takedownReason: null } });
    return this.detail(id);
  }

  private async exists(id: string) {
    const found = await this.prisma.world.count({ where: { id } });
    if (!found) throw new NotFoundException('세계관을 찾을 수 없어요.');
  }

  // 검수 대기: 장면 그림(PENDING)과 지도(PENDING)
  async reviewQueue() {
    const [images, maps] = await Promise.all([
      this.prisma.worldImage.findMany({
        where: { review: PortraitReview.PENDING, blockedAt: null },
        orderBy: { createdAt: 'asc' },
        take: 100,
        select: { id: true, label: true, character: true, reviewNote: true, createdAt: true, world: { select: { id: true, title: true, owner: { select: { email: true } } } } },
      }),
      this.prisma.world.findMany({
        where: { mapReview: PortraitReview.PENDING, mapMime: { not: null } },
        take: 100,
        select: { id: true, title: true, updatedAt: true, owner: { select: { email: true } } },
      }),
    ]);
    return { images, maps };
  }

  // 그림 결정: approve(공개) · reject(검수 거절, 만든 사람만 봄) · block(운영자가 막음 — 진행자에게도 안 나감)
  async decideImage(imageId: string, body: { decision?: unknown; note?: unknown } | undefined) {
    const decision = body?.decision;
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 200) : null;
    const image = await this.prisma.worldImage.findUnique({ where: { id: imageId }, select: { id: true } });
    if (!image) throw new NotFoundException('그림을 찾을 수 없어요.');
    const data: Prisma.WorldImageUpdateInput =
      decision === 'approve'
        ? { review: PortraitReview.APPROVED, reviewNote: note, blockedAt: null }
        : decision === 'reject'
          ? { review: PortraitReview.REJECTED, reviewNote: note || '운영자 검수에서 거절됐어요.' }
          : decision === 'block'
            ? { blockedAt: new Date(), reviewNote: note || '운영자가 막았어요.' }
            : decision === 'unblock'
              ? { blockedAt: null }
              : (() => {
                  throw new BadRequestException('decision은 approve · reject · block · unblock 중 하나예요.');
                })();
    return this.prisma.worldImage.update({ where: { id: imageId }, data, select: { id: true, review: true, reviewNote: true, blockedAt: true } });
  }

  async decideMap(id: string, decision: unknown) {
    if (decision !== 'approve' && decision !== 'reject' && decision !== 'remove') throw new BadRequestException('decision은 approve · reject · remove 중 하나예요.');
    await this.exists(id);
    const data: Prisma.WorldUpdateInput =
      decision === 'remove'
        ? { map: null, mapMime: null, mapReview: PortraitReview.APPROVED }
        : { mapReview: decision === 'approve' ? PortraitReview.APPROVED : PortraitReview.REJECTED };
    await this.prisma.world.update({ where: { id }, data });
    return this.detail(id);
  }

  async image(id: string, imageId: string) {
    const image = await this.prisma.worldImage.findFirst({ where: { id: imageId, worldId: id }, select: { data: true, mime: true } });
    return image ? { data: Buffer.from(image.data), mime: image.mime } : null;
  }

  async map(id: string) {
    const world = await this.prisma.world.findUnique({ where: { id }, select: { map: true, mapMime: true } });
    return world?.map && world.mapMime ? { data: Buffer.from(world.map), mime: world.mapMime } : null;
  }

  // 이벤트 기록 (최근 순). status: open|won|lost|expired|all
  async events(opts: { status?: string; take?: string; q?: string }) {
    const status = (opts.status ?? 'all').toUpperCase();
    const where: Prisma.WorldEventWhereInput = status in WorldEventStatus ? { status: status as WorldEventStatus } : {};
    const q = (opts.q ?? '').trim().slice(0, 60);
    if (q) where.play = { OR: [{ user: { email: { contains: q, mode: 'insensitive' } } }, { world: { title: { contains: q, mode: 'insensitive' } } }] };
    const take = Math.max(1, Math.min(300, Number(opts.take) || 100));
    const rows = await this.prisma.worldEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        kind: true,
        status: true,
        reward: true,
        rewarded: true,
        rewardDay: true,
        createdAt: true,
        resolvedAt: true,
        play: { select: { personaName: true, user: { select: { id: true, email: true } }, world: { select: { id: true, title: true } } } },
      },
    });
    return rows.map((e) => ({ ...e, label: EVENT_LABELS[e.kind] }));
  }

  getSettings() {
    return this.settings.get();
  }

  setSettings(body: unknown) {
    return this.settings.set(body);
  }
}
