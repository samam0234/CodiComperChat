import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminContentReportsController, ContentReportController } from './content-reports.controller.js';
import { ContentReportsService } from './content-reports.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ContentReportController, AdminContentReportsController],
  providers: [ContentReportsService, AdminGuard],
})
export class ContentReportsModule {}
