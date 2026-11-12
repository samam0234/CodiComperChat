import { Module } from '@nestjs/common';
import { AuthModule } from '../../account/auth/auth.module.js';
import { ModelsModule } from '../../billing/models/models.module.js';
import { PersonasModule } from '../../chat/personas/personas.module.js';
import { PortraitReviewService } from '../../studio/studio/portrait-review.service.js';
import { AdminWorldsController } from './admin-worlds.controller.js';
import { AdminWorldsService } from './admin-worlds.service.js';
import { WorldPlayService } from './world-play.service.js';
import { WorldSettingsService } from './world-settings.service.js';
import { WorldsController } from './worlds.controller.js';
import { WorldsService } from './worlds.service.js';

// 월드코퍼챗 (2026-11-06): 세계관 만들기·플레이·이벤트 미니게임, 운영 콘솔 관리
@Module({
  imports: [AuthModule, ModelsModule, PersonasModule],
  controllers: [WorldsController, AdminWorldsController],
  providers: [WorldsService, WorldPlayService, WorldSettingsService, AdminWorldsService, PortraitReviewService],
})
export class WorldsModule {}
