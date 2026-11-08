import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminSupportController, SupportController } from './support.controller.js';
import { SupportService } from './support.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, AdminGuard],
})
export class SupportModule {}
