import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
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
  testCritique(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.test.critique(userId, id);
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
