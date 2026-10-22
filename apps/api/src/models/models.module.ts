import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CreditsModule } from '../credits/credits.module.js';
import { ModelsController } from './models.controller.js';
import { ModelsService } from './models.service.js';

@Module({
  imports: [AuthModule, CreditsModule],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
