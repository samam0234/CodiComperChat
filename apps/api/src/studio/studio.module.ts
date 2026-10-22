import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PersonaRagModule } from '../persona-rag/persona-rag.module.js';
import { PersonasModule } from '../personas/personas.module.js';
import { AdminPortraitsController } from './admin-portraits.controller.js';
import { PortraitReviewService } from './portrait-review.service.js';
import { StudioDraftService } from './studio-draft.service.js';
import { StudioPublishService } from './studio-publish.service.js';
import { StudioTestService } from './studio-test.service.js';
import { StudioController } from './studio.controller.js';
import { StudioService } from './studio.service.js';

@Module({
  imports: [AuthModule, PersonaRagModule, PersonasModule],
  controllers: [StudioController, AdminPortraitsController],
  providers: [StudioService, StudioTestService, StudioPublishService, StudioDraftService, PortraitReviewService],
  exports: [StudioService, StudioTestService, StudioPublishService],
})
export class StudioModule {}
