import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { CharactersModule } from './characters/characters.module.js';
import { HealthModule } from './health/health.module.js';
import { StudioModule } from './studio/studio.module.js';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    CharactersModule,
    CampaignsModule,
    StudioModule,
  ],
})
export class AppModule {}
