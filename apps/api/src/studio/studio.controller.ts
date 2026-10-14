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
import { StudioTestService } from './studio-test.service.js';
import { StudioService } from './studio.service.js';

// 캐릭터 공방 (기획서 §6). 초안 만들기·고치기는 로그인한 누구나, 발행은 운영자만
@Controller('studio/characters')
@UseGuards(AuthGuard)
export class StudioController {
  constructor(
    private readonly studio: StudioService,
    private readonly test: StudioTestService,
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
}
