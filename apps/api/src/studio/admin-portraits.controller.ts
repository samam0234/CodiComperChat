import { Body, Controller, Get, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PortraitReviewService } from './portrait-review.service.js';

// 운영자만: 자동 검수가 넘긴 초상 확인
@Controller('admin/portraits')
@UseGuards(AuthGuard, AdminGuard)
export class AdminPortraitsController {
  constructor(private readonly reviews: PortraitReviewService) {}

  @Get()
  list() {
    return this.reviews.pending();
  }

  @Get(':draftId/image')
  async image(@Param('draftId') draftId: string, @Res() res: Response) {
    const image = await this.reviews.image(draftId);
    res.setHeader('Content-Type', image.mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(image.data);
  }

  // { decision: 'approve' | 'reject', note } — 반려는 사유 필수(만든 사람에게 보인다)
  @Post(':draftId')
  @HttpCode(204)
  async decide(@Param('draftId') draftId: string, @Body() body: { decision?: unknown; note?: unknown } | undefined) {
    await this.reviews.decide(draftId, body);
  }
}
