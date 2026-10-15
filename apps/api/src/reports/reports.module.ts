import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminReportsController, CharacterReportController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CharacterReportController, AdminReportsController],
  providers: [ReportsService, AdminGuard],
})
export class ReportsModule {}
