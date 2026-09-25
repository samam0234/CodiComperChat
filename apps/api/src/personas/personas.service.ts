import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export const PERSONA_NAME_MAX = 20;
export const PERSONA_DESCRIPTION_MAX = 300;
export const PERSONA_LIMIT = 10;

export type PersonaInput = { name: string; description: string };

const PUBLIC_PERSONA = {
  id: true,
  name: true,
  description: true,
  updatedAt: true,
} as const;

export function parsePersona(body: unknown): PersonaInput {
  const data =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (name.length < 1 || name.length > PERSONA_NAME_MAX) {
    throw new BadRequestException(
      `이름은 1자 이상 ${PERSONA_NAME_MAX}자 이하여야 합니다.`,
    );
  }

  const description =
    typeof data.description === 'string' ? data.description.trim() : '';
  if (description.length > PERSONA_DESCRIPTION_MAX) {
    throw new BadRequestException(
      `소개는 ${PERSONA_DESCRIPTION_MAX}자 이하여야 합니다.`,
    );
  }

  return { name, description };
}

// 모든 조회·수정에 userId를 조건으로 건다 — 남의 프로필은 있어도 "없음"(404)으로 보인다
@Injectable()
export class PersonasService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.userPersona.findMany({
      where: { userId },
      select: PUBLIC_PERSONA,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOwned(userId: string, id: string) {
    const persona = await this.prisma.userPersona.findFirst({
      where: { id, userId },
      select: PUBLIC_PERSONA,
    });
    if (!persona) throw new NotFoundException('프로필 캐릭터를 찾을 수 없습니다.');
    return persona;
  }

  async create(userId: string, input: PersonaInput) {
    const count = await this.prisma.userPersona.count({ where: { userId } });
    if (count >= PERSONA_LIMIT) {
      throw new ConflictException(
        `프로필 캐릭터는 ${PERSONA_LIMIT}개까지 만들 수 있습니다.`,
      );
    }
    return this.prisma.userPersona.create({
      data: { userId, ...input },
      select: PUBLIC_PERSONA,
    });
  }

  async update(userId: string, id: string, input: PersonaInput) {
    await this.findOwned(userId, id);
    return this.prisma.userPersona.update({
      where: { id },
      data: input,
      select: PUBLIC_PERSONA,
    });
  }

  async remove(userId: string, id: string) {
    const { count } = await this.prisma.userPersona.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('프로필 캐릭터를 찾을 수 없습니다.');
  }
}
