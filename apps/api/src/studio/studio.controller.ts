import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { RateLimit } from '../security/rate-limit.js';
import { parsePortrait } from './portrait.js';
import { StudioDraftService } from './studio-draft.service.js';
import { StudioPublishService } from './studio-publish.service.js';
import { StudioTestService } from './studio-test.service.js';
import { StudioService } from './studio.service.js';

// 캐릭터 공방 (기획서 §6). 초안 만들기·고치기·발행은 로그인한 누구나 (공개 범위는 주인이 고른다)
@Controller('studio/characters')
@UseGuards(AuthGuard)
export class StudioController {
  constructor(
    private readonly studio: StudioService,
    private readonly test: StudioTestService,
    private readonly publisher: StudioPublishService,
    private readonly drafter: StudioDraftService,
  ) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.studio.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string) {
    return this.studio.create(userId);
  }

  @Get(':id')
  get(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.studio.get(userId, id);
  }

  @Patch(':id')
  save(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: { card?: unknown }) {
    return this.studio.save(userId, id, body?.card);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.studio.remove(userId, id);
  }

  // 3턴 테스트 (§6.1). 대화는 서버가 들고 있고, 카드를 고치면 새로 시작한다
  @Post(':id/test/chat')
  @HttpCode(200)
  @RateLimit('studioLlm')
  testChat(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() body: { message?: unknown; personaId?: unknown },
  ) {
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (message === '') throw new BadRequestException('message가 비어 있다');
    if (message.length > 2000) throw new BadRequestException('메시지는 2000자 이하로 보내 주세요.');
    const personaId = typeof body?.personaId === 'string' && body.personaId !== '' ? body.personaId : undefined;
    return this.test.chat(userId, id, message, personaId);
  }

  @Post(':id/test/critique')
  @HttpCode(200)
  @RateLimit('studioLlm')
  testCritique(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.test.critique(userId, id);
  }

  // 흉상 초상 이미지. 본문은 이미지 원본(webp·jpeg·png, 150KB 이하). 카드와 따로라 다시 테스트할 필요 없다
  @Put(':id/portrait')
  @HttpCode(200)
  @RateLimit('upload')
  setPortrait(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Headers('content-type') contentType: string | undefined,
    @Body() body: unknown,
  ) {
    return this.studio.setPortrait(userId, id, parsePortrait(contentType, body));
  }

  @Delete(':id/portrait')
  @HttpCode(200)
  removePortrait(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.studio.setPortrait(userId, id, null);
  }

  @Get(':id/portrait')
  async portrait(@CurrentUserId() userId: string, @Param('id') id: string, @Res() res: Response) {
    const image = await this.studio.portrait(userId, id);
    res.setHeader('Content-Type', image.mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(image.data);
  }

  // "이 칸만 AI로 초안" { field: 'campaign.scene' 등 }. 제안만 돌려주고 카드는 바뀌지 않는다
  @Post(':id/draft-field')
  @HttpCode(200)
  @RateLimit('studioLlm')
  draftField(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: { field?: unknown }) {
    return this.drafter.draftField(userId, id, body?.field);
  }

  // 비밀 퀘스트를 한 번에 AI로 제안 (카드 설정을 읽는다). 저장하지 않고, 유저가 보고 적용한다
  @Post(':id/draft-quest')
  @HttpCode(200)
  @RateLimit('studioLlm')
  draftQuest(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.drafter.draftQuest(userId, id);
  }

  // 성격·말투 단계의 말투 샘플 답 2개. 저장하지 않으며 3턴 테스트에 영향이 없다
  @Post(':id/samples')
  @HttpCode(200)
  @RateLimit('studioLlm')
  samples(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.test.samples(userId, id);
  }

  @Post(':id/test/reset')
  @HttpCode(204)
  async testReset(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.test.reset(userId, id);
  }

  // 발행·내리기는 초안 주인이. 필수 단계 + 지금 카드로 테스트 통과가 조건
  @Post(':id/publish')
  @HttpCode(200)
  publish(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.publisher.publish(userId, id);
  }

  // 공개 범위 { visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' }
  @Patch(':id/visibility')
  setVisibility(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: { visibility?: unknown }) {
    return this.publisher.setVisibility(userId, id, body?.visibility);
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  unpublish(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.publisher.unpublish(userId, id);
  }
}
