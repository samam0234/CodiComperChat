import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { DEFAULT_WORLD_SETTINGS, parseWorldSettings, type WorldSettings } from '../document/world.js';

const KEY = 'world';

// 월드코퍼챗 운영 설정(하루 보상 횟수·이벤트 확률·간격). 운영 콘솔에서 바꾸고, 없으면 기본값
@Injectable()
export class WorldSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<WorldSettings> {
    const row = await this.prisma.appSetting.findUnique({ where: { key: KEY } });
    if (!row) return DEFAULT_WORLD_SETTINGS;
    try {
      return parseWorldSettings(row.value);
    } catch {
      // 손으로 고친 값이 깨졌으면 기본값으로 돈다 (콘솔에서 다시 저장하면 고쳐진다)
      return DEFAULT_WORLD_SETTINGS;
    }
  }

  async set(raw: unknown): Promise<WorldSettings> {
    const next = parseWorldSettings(raw, await this.get());
    const value = next as unknown as Prisma.InputJsonValue;
    await this.prisma.appSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
    return next;
  }
}
