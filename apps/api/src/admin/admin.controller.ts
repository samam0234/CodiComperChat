import { Controller, Get, NotFoundException, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminService } from './admin.service.js';

// 운영자만: 콘솔 대시보드와 캐릭터 전체 목록
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  // ?q=이름·소개 &filter=all|public|unlisted|private|official|taken-down|unpublished &take=1~200
  @Get('characters')
  characters(@Query('q') q?: string, @Query('filter') filter?: string, @Query('take') take?: string) {
    return this.admin.characters({ q, filter, take });
  }

  // 비공개·내려간 캐릭터까지 초상 그림 (운영자 확인용, 캐시하지 않음)
  @Get('characters/:id/portrait')
  async portrait(@Param('id') id: string, @Res() res: Response) {
    const image = await this.admin.portrait(id);
    if (!image) throw new NotFoundException('초상이 없습니다.');
    res.setHeader('Content-Type', image.mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(image.data);
  }
}
