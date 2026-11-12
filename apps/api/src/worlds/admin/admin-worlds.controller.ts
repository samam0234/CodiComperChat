import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from '../../account/auth/admin.guard.js';
import { AuthGuard } from '../../account/auth/auth.guard.js';
import { AdminWorldsService } from './admin-worlds.service.js';

function sendPrivate(res: Response, image: { data: Buffer; mime: string } | null) {
  if (!image) throw new NotFoundException('그림이 없습니다.');
  res.setHeader('Content-Type', image.mime);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.send(image.data);
}

// 운영자만: 월드코퍼챗 관리 (2026-11-06)
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminWorldsController {
  constructor(private readonly admin: AdminWorldsService) {}

  @Get('world-stats')
  stats() {
    return this.admin.stats();
  }

  // ?q=제목·소개·만든 사람 &filter=all|public|unlisted|private|unpublished|taken-down|needs-review &take=1~200
  @Get('worlds')
  list(@Query('q') q?: string, @Query('filter') filter?: string, @Query('take') take?: string) {
    return this.admin.list({ q, filter, take });
  }

  @Get('worlds/:id')
  detail(@Param('id') id: string) {
    return this.admin.detail(id);
  }

  @Post('worlds/:id/takedown')
  @HttpCode(200)
  takedown(@Param('id') id: string, @Body() body: { reason?: unknown }) {
    return this.admin.takedown(id, body?.reason);
  }

  @Post('worlds/:id/restore')
  @HttpCode(200)
  restore(@Param('id') id: string) {
    return this.admin.restore(id);
  }

  @Post('worlds/:id/map-review')
  @HttpCode(200)
  decideMap(@Param('id') id: string, @Body() body: { decision?: unknown }) {
    return this.admin.decideMap(id, body?.decision);
  }

  @Get('worlds/:id/map')
  async map(@Param('id') id: string, @Res() res: Response) {
    sendPrivate(res, await this.admin.map(id));
  }

  @Get('worlds/:id/images/:imageId')
  async image(@Param('id') id: string, @Param('imageId') imageId: string, @Res() res: Response) {
    sendPrivate(res, await this.admin.image(id, imageId));
  }

  @Get('world-review')
  reviewQueue() {
    return this.admin.reviewQueue();
  }

  @Post('world-images/:imageId')
  @HttpCode(200)
  decideImage(@Param('imageId') imageId: string, @Body() body: { decision?: unknown; note?: unknown }) {
    return this.admin.decideImage(imageId, body);
  }

  // ?status=all|open|won|lost|expired &q=이메일·세계관 &take=1~300
  @Get('world-events')
  events(@Query('status') status?: string, @Query('q') q?: string, @Query('take') take?: string) {
    return this.admin.events({ status, q, take });
  }

  @Get('world-settings')
  getSettings() {
    return this.admin.getSettings();
  }

  @Put('world-settings')
  setSettings(@Body() body: unknown) {
    return this.admin.setSettings(body);
  }
}
