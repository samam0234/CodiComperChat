import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.character.findMany({
      where: { published: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
