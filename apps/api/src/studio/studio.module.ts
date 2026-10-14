import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StudioController } from './studio.controller.js';
import { StudioService } from './studio.service.js';

@Module({
  imports: [AuthModule],
  controllers: [StudioController],
  providers: [StudioService],
  exports: [StudioService],
})
export class StudioModule {}
