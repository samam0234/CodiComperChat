import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { REPORT_REASONS, ReportsService } from './reports.service.js';

// 로그인한 누구나: 보이는 캐릭터 신고
@Controller('characters/:id/report')
@UseGuards(AuthGuard)
export class CharacterReportController {
  constructor(private readonly reports: ReportsService) {}

  @Get('reasons')
  reasons() {
    return REPORT_REASONS;
  }

  @Post()
  @HttpCode(204)
  async report(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: unknown) {
    await this.reports.report(userId, id, body);
  }
}

// 운영자만: 신고 처리 (AuthGuard로 로그인, AdminGuard로 DB의 role 확인)
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('reports')
  async list() {
    const [open, takenDown] = await Promise.all([this.reports.openByCharacter(), this.reports.takenDown()]);
    return { reasons: REPORT_REASONS, open, takenDown };
  }

  // { note } 필수 — 캐릭터 주인에게 보인다
  @Post('characters/:id/take-down')
  @HttpCode(204)
  async takeDown(@Param('id') id: string, @Body() body: { note?: unknown }) {
    await this.reports.takeDown(id, body?.note);
  }

  @Post('characters/:id/dismiss-reports')
  @HttpCode(204)
  async dismiss(@Param('id') id: string, @Body() body: { note?: unknown }) {
    await this.reports.dismiss(id, body?.note);
  }

  @Post('characters/:id/restore')
  @HttpCode(204)
  async restore(@Param('id') id: string) {
    await this.reports.restore(id);
  }
}
