import { Module } from '@nestjs/common';
import { AuthModule } from '../../account/auth/auth.module.js';
import { PersonaRagModule } from '../../chat/persona-rag/persona-rag.module.js';
import { CreditsModule } from '../../billing/credits/credits.module.js';
import { PersonasModule } from '../../chat/personas/personas.module.js';
import { AdminPortraitsController } from '../portrait/admin-portraits.controller.js';
import { PortraitReviewService } from '../portrait/portrait-review.service.js';
import { StudioDraftService } from '../draft/studio-draft.service.js';
import { StudioPortraitAiService } from '../portrait/studio-portrait-ai.service.js';
import { StudioPublishService } from '../publish/studio-publish.service.js';
import { StudioTestService } from '../trial/studio-test.service.js';
import { StudioController } from './studio.controller.js';
import { StudioService } from '../draft/studio.service.js';

@Module({
  imports: [AuthModule, PersonaRagModule, PersonasModule, CreditsModule],
  controllers: [StudioController, AdminPortraitsController],
  providers: [StudioService, StudioTestService, StudioPublishService, StudioDraftService, PortraitReviewService, StudioPortraitAiService],
  exports: [StudioService, StudioTestService, StudioPublishService],
})
export class StudioModule {}
