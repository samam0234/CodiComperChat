import { Body, Controller, Get, HttpCode, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { RateLimit } from '../security/rate-limit.js';
import { CONTENT_REPORT_REASONS, ContentReportsService } from './content-reports.service.js';

// 로그인한 사람: 자기 코디포토넷 그림·웹툰 신고. 다른 사람에게는 안 보이는 그림이라 만든 사람만 올린다
@Controller('characters/:id/content-reports')
@UseGuards(AuthGuard)
export class ContentReportController {
  constructor(private readonly reports: ContentReportsService) {}

  @Get('reasons')
  reasons() {
    return CONTENT_REPORT_REASONS;
  }

  @Post()
  @HttpCode(204)
  @RateLimit('report')
  async report(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: unknown) {
    await this.reports.report(userId, id, body);
  }
}

// 운영자: 그림 신고를 보고 접근을 막거나 계정을 정지한다
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminContentReportsController {
  constructor(private readonly reports: ContentReportsService) {}

  @Get('content-reports')
  async list() {
    const [open, blocked] = await Promise.all([this.reports.openQueue(), this.reports.blocked()]);
    return { reasons: CONTENT_REPORT_REASONS, open, blocked };
  }

  @Get('content-reports/:id/image')
  async image(@Param('id') id: string, @Query('panel') panel: string | undefined, @Res() res: Response) {
    const image = await this.reports.image(id, panel);
    res.setHeader('Content-Type', image.mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(image.data);
  }

  // { note, suspend? } note는 만든 사람에게 보이는 차단 사유
  @Post('content-reports/:id/block')
  @HttpCode(204)
  async block(@Param('id') id: string, @Body() body: { note?: unknown; suspend?: unknown }) {
    await this.reports.block(id, body?.note, body?.suspend === true);
  }

  @Post('content-reports/:id/dismiss')
  @HttpCode(204)
  async dismiss(@Param('id') id: string, @Body() body: { note?: unknown }) {
    await this.reports.dismiss(id, body?.note);
  }

  @Post('users/:id/unsuspend')
  @HttpCode(204)
  async unsuspend(@Param('id') id: string) {
    await this.reports.unsuspend(id);
  }
}
