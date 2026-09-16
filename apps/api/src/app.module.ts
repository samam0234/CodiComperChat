import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { CharactersModule } from './characters/characters.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StudioModule } from './studio/studio.module.js';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    CharactersModule,
    CampaignsModule,
    StudioModule,
  ],
})
export class AppModule {}
