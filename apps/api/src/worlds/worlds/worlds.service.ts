import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CharacterVisibility, PortraitReview, type Prisma } from '@prisma/client';
import { josa } from '../../core/common/korean-josa.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { PortraitReviewService } from '../../studio/studio/portrait-review.service.js';
import type { PortraitMime } from '../../studio/studio/portrait.js';
import { WORLD_LIMITS, canView, parseVisibility, parseWorldDocument, publishProblems } from './world.js';

type Image = { data: Buffer; mime: PortraitMime };

const LIST_FIELDS = {
  id: true,
  title: true,
  oneLiner: true,
  mode: true,
  visibility: true,
  published: true,
  takenDownAt: true,
  updatedAt: true,
  mapMime: true,
  _count: { select: { cast: true, parts: true, plays: true } },
} as const;

type ListRow = Prisma.WorldGetPayload<{ select: typeof LIST_FIELDS }>;
const present = (w: ListRow) => ({
  id: w.id,
  title: w.title,
  oneLiner: w.oneLiner,
  mode: w.mode,
  visibility: w.visibility,
  published: w.published,
  takenDown: w.takenDownAt !== null,
  updatedAt: w.updatedAt,
  hasMap: w.mapMime !== null,
  castCount: w._count.cast,
  partCount: w._count.parts,
  playCount: w._count.plays,
});

// 월드코퍼챗: 세계관 만들기·고치기·발행과 보기. 플레이는 WorldPlayService
@Injectable()
export class WorldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly review: PortraitReviewService,
  ) {}

  // 공개 목록: 발행했고 공개이고 내려가지 않은 것
  async listPublic(q?: string) {
    const query = (q ?? '').trim().slice(0, 40);
    const rows = await this.prisma.world.findMany({
      where: {
        published: true,
        visibility: CharacterVisibility.PUBLIC,
        takenDownAt: null,
        ...(query ? { OR: [{ title: { contains: query, mode: 'insensitive' } }, { oneLiner: { contains: query, mode: 'insensitive' } }] } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 60,
      select: LIST_FIELDS,
    });
    return rows.map(present);
  }

  async listMine(userId: string) {
    const rows = await this.prisma.world.findMany({ where: { ownerId: userId }, orderBy: { updatedAt: 'desc' }, select: LIST_FIELDS });
    return rows.map(present);
  }

  async create(userId: string) {
    const count = await this.prisma.world.count({ where: { ownerId: userId } });
    if (count >= 30) throw new BadRequestException('세계관은 한 계정에 30개까지 만들 수 있어요.');
    return this.prisma.world.create({ data: { ownerId: userId, title: '새 세계관' }, select: { id: true } });
  }

  private async owned(userId: string, id: string) {
    const world = await this.prisma.world.findUnique({ where: { id }, select: { id: true, ownerId: true, published: true, takenDownAt: true } });
    if (!world) throw new NotFoundException('세계관을 찾을 수 없어요.');
    if (world.ownerId !== userId) throw new ForbiddenException('내가 만든 세계관만 고칠 수 있어요.');
    return world;
  }

  // 편집기: 목표·검수 상태까지 전부
  async getForEdit(userId: string, id: string) {
    await this.owned(userId, id);
    const world = await this.prisma.world.findUniqueOrThrow({
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
        updatedAt: true,
        cast: { orderBy: { order: 'asc' }, select: { name: true, summary: true, speech: true, startPlace: true, homePlace: true, characterId: true } },
        places: { orderBy: { order: 'asc' }, select: { name: true, x: true, y: true, note: true } },
        parts: { orderBy: { order: 'asc' }, select: { title: true, goal: true, opening: true } },
        images: { orderBy: { createdAt: 'asc' }, select: { id: true, label: true, character: true, review: true, reviewNote: true, blockedAt: true } },
      },
    });
    const { mapMime, takenDownAt, images, ...rest } = world;
    return {
      ...rest,
      takenDown: takenDownAt !== null,
      hasMap: mapMime !== null,
      images: images.map(({ blockedAt, ...i }) => ({ ...i, blocked: blockedAt !== null })),
      problems: publishProblems({ ...world, castCount: world.cast.length }),
    };
  }

  // 등장인물로 데려올 수 있는 캐릭터: 발행했고 내려가지 않았고, 공개이거나 내 것
  async castCandidates(userId: string, q?: string) {
    const query = (q ?? '').trim().slice(0, 40);
    return this.prisma.character.findMany({
      where: {
        published: true,
        takenDownAt: null,
        OR: [{ visibility: CharacterVisibility.PUBLIC }, { ownerId: userId }],
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
      take: 30,
      select: { id: true, name: true, oneLiner: true, speechStyle: true },
    });
  }

  async save(userId: string, id: string, raw: unknown) {
    const world = await this.owned(userId, id);
    const doc = parseWorldDocument(raw);
    if (world.published) {
      const problems = publishProblems({ ...doc, castCount: doc.cast.length });
      if (problems.length) throw new BadRequestException(`발행 중인 세계관이라 다음이 빠지면 저장할 수 없어요: ${problems.join(', ')}`);
    }
    // 데려온 캐릭터는 내가 볼 수 있는 것만
    const linked = [...new Set(doc.cast.map((c) => c.characterId).filter((c): c is string => c !== null))];
    if (linked.length) {
      const ok = await this.prisma.character.count({
        where: { id: { in: linked }, published: true, takenDownAt: null, OR: [{ visibility: { not: CharacterVisibility.PRIVATE } }, { ownerId: userId }] },
      });
      if (ok !== linked.length) throw new BadRequestException('데려올 수 없는 캐릭터가 있어요.');
    }
    await this.prisma.$transaction([
      this.prisma.world.update({
        where: { id },
        data: { title: doc.title || '새 세계관', oneLiner: doc.oneLiner, setting: doc.setting, rules: doc.rules, opening: doc.opening, mode: doc.mode },
      }),
      this.prisma.worldCast.deleteMany({ where: { worldId: id } }),
      this.prisma.worldPlace.deleteMany({ where: { worldId: id } }),
      this.prisma.worldPart.deleteMany({ where: { worldId: id } }),
      this.prisma.worldCast.createMany({ data: doc.cast.map((c, order) => ({ ...c, worldId: id, order })) }),
      this.prisma.worldPlace.createMany({ data: doc.places.map((p, order) => ({ ...p, worldId: id, order })) }),
      this.prisma.worldPart.createMany({ data: doc.parts.map((p, order) => ({ ...p, worldId: id, order })) }),
    ]);
    return this.getForEdit(userId, id);
  }

  async publish(userId: string, id: string, visibilityRaw: unknown) {
    const world = await this.owned(userId, id);
    if (world.takenDownAt) throw new ForbiddenException('운영자가 내린 세계관은 다시 발행할 수 없어요.');
    const visibility = parseVisibility(visibilityRaw ?? 'PUBLIC');
    const full = await this.prisma.world.findUniqueOrThrow({ where: { id }, select: { title: true, setting: true, opening: true, _count: { select: { cast: true } } } });
    const problems = publishProblems({ ...full, castCount: full._count.cast });
    if (problems.length) throw new BadRequestException(`발행하려면 다음을 채워 주세요: ${problems.join(', ')}`);
    await this.prisma.world.update({ where: { id }, data: { published: true, visibility } });
    return this.getForEdit(userId, id);
  }

  async unpublish(userId: string, id: string) {
    await this.owned(userId, id);
    await this.prisma.world.update({ where: { id }, data: { published: false } });
    return this.getForEdit(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.owned(userId, id);
    await this.prisma.world.delete({ where: { id } });
  }

  // 장면 그림 올리기. 같은 이름표가 있으면 바꾼다. 자동 검수에서 막히면 400, 애매하면 운영자 검수 대기
  async uploadImage(userId: string, id: string, labelRaw: unknown, characterRaw: unknown, image: Image) {
    await this.owned(userId, id);
    const label = typeof labelRaw === 'string' ? labelRaw.trim() : '';
    if (!label || label.length > WORLD_LIMITS.imageLabel || /[[\]\n]/.test(label)) {
      throw new BadRequestException(`그림 이름표는 1~${WORLD_LIMITS.imageLabel}자, 대괄호·줄바꿈 없이 써 주세요.`);
    }
    const character = typeof characterRaw === 'string' ? characterRaw.trim() : '';
    if (character) {
      const inCast = await this.prisma.worldCast.count({ where: { worldId: id, name: character } });
      if (!inCast) throw new BadRequestException(`${josa(`"${character}"`, '은/는')} 등장인물에 없어요. 먼저 등장인물을 저장해 주세요.`);
    }
    const existing = await this.prisma.worldImage.findUnique({ where: { worldId_label: { worldId: id, label } }, select: { id: true } });
    if (!existing && (await this.prisma.worldImage.count({ where: { worldId: id } })) >= WORLD_LIMITS.images) {
      throw new BadRequestException(`장면 그림은 ${WORLD_LIMITS.images}장까지예요.`);
    }
    const { review, note } = await this.review.moderate(image);
    const data = { label, character, mime: image.mime, data: new Uint8Array(image.data), review, reviewNote: note, blockedAt: null };
    const saved = await this.prisma.worldImage.upsert({
      where: { worldId_label: { worldId: id, label } },
      create: { ...data, worldId: id },
      update: data,
      select: { id: true, label: true, character: true, review: true, reviewNote: true },
    });
    await this.prisma.world.update({ where: { id }, data: { updatedAt: new Date() } });
    return saved;
  }

  async deleteImage(userId: string, id: string, imageId: string) {
    await this.owned(userId, id);
    const { count } = await this.prisma.worldImage.deleteMany({ where: { id: imageId, worldId: id } });
    if (!count) throw new NotFoundException('그림을 찾을 수 없어요.');
  }

  async setMap(userId: string, id: string, image: Image) {
    await this.owned(userId, id);
    const { review, note } = await this.review.moderate(image);
    await this.prisma.world.update({ where: { id }, data: { map: new Uint8Array(image.data), mapMime: image.mime, mapReview: review } });
    return { review, note };
  }

  async deleteMap(userId: string, id: string) {
    await this.owned(userId, id);
    await this.prisma.world.update({ where: { id }, data: { map: null, mapMime: null, mapReview: PortraitReview.APPROVED } });
  }

  // 보는 사람용 상세. 파트 목표는 보여 주지 않는다(판정만 쓴다)
  async detail(viewerId: string | null, id: string) {
    const world = await this.prisma.world.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        title: true,
        oneLiner: true,
        setting: true,
        mode: true,
        visibility: true,
        published: true,
        takenDownAt: true,
        takedownReason: true,
        mapMime: true,
        mapReview: true,
        owner: { select: { displayName: true } },
        cast: { orderBy: { order: 'asc' }, select: { name: true, summary: true, homePlace: true, characterId: true } },
        places: { orderBy: { order: 'asc' }, select: { name: true, x: true, y: true, note: true } },
        parts: { orderBy: { order: 'asc' }, select: { title: true } },
        _count: { select: { plays: true, images: { where: { review: PortraitReview.APPROVED, blockedAt: null } } } },
      },
    });
    if (!world || !canView(world, viewerId)) throw new NotFoundException('세계관을 찾을 수 없어요.');
    const mine = viewerId !== null && world.ownerId === viewerId;
    const { ownerId: _o, mapMime, mapReview, takenDownAt, takedownReason, owner, _count, ...rest } = world;
    return {
      ...rest,
      mine,
      author: owner?.displayName ?? '코디컴퍼챗',
      hasMap: mapMime !== null && (mapReview === PortraitReview.APPROVED || mine),
      imageCount: _count.images,
      playCount: _count.plays,
      takenDown: mine && takenDownAt !== null ? { reason: takedownReason } : null,
    };
  }

  // 장면 그림 본문: 볼 수 있는 세계관이고, 검수를 통과했고 막히지 않았을 때 (만든 사람은 검수 대기도 본다)
  async image(viewerId: string | null, id: string, imageId: string) {
    const world = await this.prisma.world.findUnique({ where: { id }, select: { ownerId: true, published: true, visibility: true, takenDownAt: true } });
    if (!world || !canView(world, viewerId)) return null;
    const mine = viewerId !== null && world.ownerId === viewerId;
    const image = await this.prisma.worldImage.findFirst({ where: { id: imageId, worldId: id }, select: { data: true, mime: true, review: true, blockedAt: true } });
    if (!image) return null;
    if (image.blockedAt || (!mine && image.review !== PortraitReview.APPROVED)) return null;
    return { data: Buffer.from(image.data), mime: image.mime };
  }

  async map(viewerId: string | null, id: string) {
    const world = await this.prisma.world.findUnique({
      where: { id },
      select: { ownerId: true, published: true, visibility: true, takenDownAt: true, map: true, mapMime: true, mapReview: true },
    });
    if (!world || !canView(world, viewerId) || !world.map || !world.mapMime) return null;
    const mine = viewerId !== null && world.ownerId === viewerId;
    if (!mine && world.mapReview !== PortraitReview.APPROVED) return null;
    return { data: Buffer.from(world.map), mime: world.mapMime };
  }
}
