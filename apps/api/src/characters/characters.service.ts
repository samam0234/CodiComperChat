import { Injectable, NotFoundException } from '@nestjs/common';
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
  createdAt: true,
} as const;

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.character.findMany({
      where: { published: true },
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOnePublished(id: string) {
    const character = await this.prisma.character.findFirst({
      where: { id, published: true },
      select: PUBLIC_FIELDS,
    });

    if (!character) {
      throw new NotFoundException(`발행된 캐릭터를 찾을 수 없다 (id: ${id})`);
    }

    return character;
  }
}
