import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PersonaRagModule } from '../persona-rag/persona-rag.module.js';
import { PersonasModule } from '../personas/personas.module.js';
import { StudioTestService } from './studio-test.service.js';
import { StudioController } from './studio.controller.js';
import { StudioService } from './studio.service.js';

@Module({
  imports: [AuthModule, PersonaRagModule, PersonasModule],
  controllers: [StudioController],
  providers: [StudioService, StudioTestService],
  exports: [StudioService, StudioTestService],
})
export class StudioModule {}
