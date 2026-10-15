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
  createdAt: true,
} as const;

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  // 홈·인기 목록: 공개만. 링크 공개·비공개는 목록에 나오지 않는다
  findPublished() {
    return this.prisma.character.findMany({
      where: { published: true, takenDownAt: null, visibility: CharacterVisibility.PUBLIC },
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: 'asc' },
    });
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
