import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, CurrentUserId } from '../../account/auth/auth.guard.js';
import { readSession } from '../../account/auth/session.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { RateLimit } from '../../core/security/rate-limit.js';
import { parseImage } from '../../studio/portrait/portrait.js';
import { WorldPlayService } from '../play/world-play.service.js';
import { WORLD_IMAGE_MAX_BYTES } from '../document/world.js';
import { WorldsService } from './worlds.service.js';

function sendImage(res: Response, image: { data: Buffer; mime: string } | null) {
  if (!image) throw new NotFoundException('그림을 찾을 수 없어요.');
  res.setHeader('Content-Type', image.mime);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.send(image.data);
}

// 월드코퍼챗 (2026-11-06). 목록·상세·그림은 로그인 없이도 공개 세계관을 볼 수 있고, 만들기·플레이는 로그인
@Controller('worlds')
export class WorldsController {
  constructor(
    private readonly worlds: WorldsService,
    private readonly plays: WorldPlayService,
    private readonly prisma: PrismaService,
  ) {}

  private viewer(authorization?: string) {
    return readSession(this.prisma, authorization);
  }

  @Get()
  list(@Query('q') q?: string) {
    return this.worlds.listPublic(q);
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  mine(@CurrentUserId() userId: string) {
    return this.worlds.listMine(userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUserId() userId: string) {
    return this.worlds.create(userId);
  }

  @Get('cast-candidates')
  @UseGuards(AuthGuard)
  candidates(@CurrentUserId() userId: string, @Query('q') q?: string) {
    return this.worlds.castCandidates(userId, q);
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.worlds.detail(await this.viewer(authorization), id);
  }

  @Get(':id/edit')
  @UseGuards(AuthGuard)
  edit(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.worlds.getForEdit(userId, id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  save(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: { world?: unknown }) {
    return this.worlds.save(userId, id, body?.world);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  publish(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: { visibility?: unknown }) {
    return this.worlds.publish(userId, id, body?.visibility);
  }

  @Post(':id/unpublish')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  unpublish(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.worlds.unpublish(userId, id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.worlds.remove(userId, id);
  }

  // 장면 그림 올리기: 본문은 그림 원본(webp·jpeg·png, 290KB 이하), 이름표·인물은 쿼리로
  @Put(':id/images')
  @UseGuards(AuthGuard)
  @RateLimit('upload')
  uploadImage(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Query('label') label: string | undefined,
    @Query('character') character: string | undefined,
    @Headers('content-type') contentType: string | undefined,
    @Body() body: unknown,
  ) {
    return this.worlds.uploadImage(userId, id, label, character, parseImage(contentType, body, WORLD_IMAGE_MAX_BYTES, '장면 그림'));
  }

  @Delete(':id/images/:imageId')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async deleteImage(@CurrentUserId() userId: string, @Param('id') id: string, @Param('imageId') imageId: string) {
    await this.worlds.deleteImage(userId, id, imageId);
  }

  @Get(':id/images/:imageId')
  async image(@Param('id') id: string, @Param('imageId') imageId: string, @Res() res: Response, @Headers('authorization') authorization?: string) {
    sendImage(res, await this.worlds.image(await this.viewer(authorization), id, imageId));
  }

  @Put(':id/map')
  @UseGuards(AuthGuard)
  @RateLimit('upload')
  setMap(@CurrentUserId() userId: string, @Param('id') id: string, @Headers('content-type') contentType: string | undefined, @Body() body: unknown) {
    return this.worlds.setMap(userId, id, parseImage(contentType, body, WORLD_IMAGE_MAX_BYTES, '코퍼맵 그림'));
  }

  @Delete(':id/map')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async deleteMap(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.worlds.deleteMap(userId, id);
  }

  @Get(':id/map')
  async map(@Param('id') id: string, @Res() res: Response, @Headers('authorization') authorization?: string) {
    sendImage(res, await this.worlds.map(await this.viewer(authorization), id));
  }

  @Get(':id/play')
  @UseGuards(AuthGuard)
  state(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.plays.state(userId, id);
  }

  @Post(':id/play')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  start(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: { personaId?: unknown; restart?: unknown }) {
    return this.plays.start(userId, id, body?.personaId, body?.restart === true);
  }

  @Post(':id/play/turn')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @RateLimit('chat')
  turn(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: { text?: unknown }) {
    return this.plays.turn(userId, id, body?.text);
  }

  @Post(':id/play/events/:eventId')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @RateLimit('chat')
  event(@CurrentUserId() userId: string, @Param('id') id: string, @Param('eventId') eventId: string, @Body() body: unknown) {
    return this.plays.playEvent(userId, id, eventId, body);
  }
}
