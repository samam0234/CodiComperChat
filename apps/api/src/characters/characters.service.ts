import { Injectable, NotFoundException } from '@nestjs/common';
import { CharacterVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

// 비밀과 해금 조건은 공개 응답에 넣지 않는다 (기획서 §13.3 "미해금은 제목만 또는 금지 목록").
// 해금 여부는 캠페인 상태를 아는 컨텍스트 조립기가 판단하므로, 캠페인 맥락이 없는
// 이 API는 아예 내려보내지 않는다.
const PUBLIC_FIELDS = {
  id: true,
  name: true,
  oneLiner: true,
  role: true,
  addressing: true,
  personalityAxes: true,
  speechStyle: true,
  knows: true,
  unknown: true,
  goal: true,
  conflictSeed: true,
  openingScene: true,
  profile: true,
  visibility: true,
  // 초상 이미지 본문은 싣지 않는다(목록이 무거워진다). 있는지만 알려 주고 GET /characters/:id/portrait로 받는다
  portraitMime: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  // 홈·인기 목록: 공개만. 링크 공개·비공개는 목록에 나오지 않는다
  async findPublished() {
    const rows = await this.prisma.character.findMany({
      where: { published: true, takenDownAt: null, visibility: CharacterVisibility.PUBLIC },
      select: { ...PUBLIC_FIELDS, ownerId: true },
      orderBy: { createdAt: 'asc' },
    });
    // ownerId는 응답에 싣지 않고, 운영 캐릭터인지(official)만 알려 준다
    return rows.map(({ ownerId, ...rest }) => ({ ...rest, official: ownerId === null }));
  }

  // 인기 목록: 공개 캐릭터를 많이 대화한 순으로. 개인을 드러내지 않게 숫자만 센다
  //  - players: 이 캐릭터와 대화를 연 사람 수(지금 대화·저장한 대화 모두, 사람마다 한 번)
  //  - messages7d: 최근 7일 동안 유저가 보낸 말 수
  // 순서: 사람 수 → 최근 7일 말 수 → 먼저 발행된 순
  async popular() {
    const [characters, players, recent] = await Promise.all([
      this.findPublished(),
      this.prisma.$queryRaw<{ characterId: string; players: bigint }[]>`
        SELECT "characterId", COUNT(DISTINCT "userId") AS players FROM "campaigns" GROUP BY "characterId"`,
      this.prisma.$queryRaw<{ characterId: string; messages: bigint }[]>`
        SELECT c."characterId", COUNT(*) AS messages
        FROM "messages" m
        JOIN "sessions" s ON s."id" = m."sessionId"
        JOIN "campaigns" c ON c."id" = s."campaignId"
        WHERE m."role" = 'USER' AND m."createdAt" > NOW() - INTERVAL '7 days'
        GROUP BY c."characterId"`,
    ]);
    const playersOf = new Map(players.map((r) => [r.characterId, Number(r.players)]));
    const recentOf = new Map(recent.map((r) => [r.characterId, Number(r.messages)]));
    return characters
      .map((c, order) => ({ ...c, order, stats: { players: playersOf.get(c.id) ?? 0, messages7d: recentOf.get(c.id) ?? 0 } }))
      .sort((a, b) => b.stats.players - a.stats.players || b.stats.messages7d - a.stats.messages7d || a.order - b.order)
      .map(({ order: _order, ...rest }, i) => ({ ...rest, rank: i + 1 }));
  }

  // 초상 이미지 본문. 보이는 캐릭터만(공개·링크 공개는 누구나, 비공개는 만든 사람만, 내려간 것은 아무도)
  async portrait(id: string, viewerId: string | null) {
    await this.findOnePublished(id, viewerId);
    const row = await this.prisma.character.findUnique({
      where: { id },
      select: { portrait: true, portraitMime: true, visibility: true, updatedAt: true },
    });
    if (!row?.portrait || !row.portraitMime) throw new NotFoundException('초상이 없습니다.');
    return { data: Buffer.from(row.portrait), mime: row.portraitMime, visibility: row.visibility, updatedAt: row.updatedAt };
  }

  // 누가 만든 캐릭터인가: 운영 캐릭터(official) / 내가 만든 것(mine) / 다른 유저. ownerId 자체는 응답에 싣지 않는다
  async origin(id: string, viewerId: string | null): Promise<{ official: boolean; mine: boolean }> {
    const row = await this.prisma.character.findUnique({ where: { id }, select: { ownerId: true } });
    return { official: row?.ownerId == null, mine: !!viewerId && row?.ownerId === viewerId };
  }

  // 공개·링크 공개는 누구나(주소를 알면), 비공개는 만든 사람만 본다.
  // 남의 비공개 캐릭터는 있는지조차 드러내지 않게 없는 것과 같은 404로 답한다
  async findOnePublished(id: string, viewerId: string | null = null) {
    const character = await this.prisma.character.findFirst({
      where: {
        id,
        published: true,
        // 운영자가 내린 캐릭터는 만든 사람에게도 보이지 않는다(만든 사람은 공방에서 사유를 본다)
        takenDownAt: null,
        OR: [
          { visibility: { in: [CharacterVisibility.PUBLIC, CharacterVisibility.UNLISTED] } },
          ...(viewerId ? [{ ownerId: viewerId }] : []),
        ],
      },
      select: PUBLIC_FIELDS,
    });

    if (!character) {
      throw new NotFoundException(`발행된 캐릭터를 찾을 수 없다 (id: ${id})`);
    }

    return character;
  }
}
