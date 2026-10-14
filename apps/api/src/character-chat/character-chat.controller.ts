import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { CharacterChatService } from './character-chat.service.js';

const MESSAGE_LIMIT = 2000;
const AVOID_LIMIT = 12;

// history는 더 이상 받지 않는다 — 대화 기록은 서버에 저장된 것을 쓴다
type ChatBody = {
  message?: unknown;
  personaId?: unknown;
  avoid?: unknown;
};

// 대화는 내 프로필 캐릭터를 고른 상태에서만 할 수 있다 (프로필은 로그인 유저의 것이다)
function requirePersonaId(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') {
    throw new BadRequestException('먼저 내 프로필 캐릭터를 선택해 주세요.');
  }
  return raw;
}

@Controller('characters/:id/chat')
export class CharacterChatController {
  constructor(private readonly characterChatService: CharacterChatService) {}

  @Get()
  history(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.characterChatService.history(id, authorization);
  }

  @Post()
  @HttpCode(200)
  send(
    @Param('id') id: string,
    @Body() body: ChatBody,
    @Headers('authorization') authorization?: string,
  ) {
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (message === '') {
      throw new BadRequestException('message가 비어 있다');
    }
    if (message.length > MESSAGE_LIMIT) {
      throw new BadRequestException(`메시지는 ${MESSAGE_LIMIT}자 이하로 보내 주세요.`);
    }

    return this.characterChatService.send(id, message, {
      personaId: requirePersonaId(body.personaId),
      authorization,
    });
  }

  @Post('suggestions')
  @HttpCode(200)
  suggest(
    @Param('id') id: string,
    @Body() body: ChatBody,
    @Headers('authorization') authorization?: string,
  ) {
    const avoid = Array.isArray(body?.avoid)
      ? body.avoid
          .filter((s): s is string => typeof s === 'string')
          .slice(-AVOID_LIMIT)
          .map((s) => s.slice(0, 200))
      : [];

    return this.characterChatService.suggest(id, avoid, {
      personaId: requirePersonaId(body?.personaId),
      authorization,
    });
  }

  // 새로하기 { save }: 지금 대화를 저장하거나 지우고 시작 장면부터 다시 연다. 프로필 고정도 풀린다
  @Post('new')
  @HttpCode(200)
  startNew(@Param('id') id: string, @Body() body: { save?: unknown }, @Headers('authorization') authorization?: string) {
    return this.characterChatService.startNew(id, body?.save === true, authorization);
  }

  // 이어하기 목록: 이 캐릭터와 저장한 대화
  @Get('saved')
  listSaved(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.characterChatService.listSaved(id, authorization);
  }

  // 이어하기 { saveCurrent }: 저장한 대화를 지금 대화로 되살린다
  @Post('saved/:campaignId/resume')
  @HttpCode(200)
  resume(
    @Param('id') id: string,
    @Param('campaignId') campaignId: string,
    @Body() body: { saveCurrent?: unknown },
    @Headers('authorization') authorization?: string,
  ) {
    return this.characterChatService.resume(id, campaignId, body?.saveCurrent === true, authorization);
  }

  @Delete('saved/:campaignId')
  @HttpCode(204)
  async removeSaved(
    @Param('id') id: string,
    @Param('campaignId') campaignId: string,
    @Headers('authorization') authorization?: string,
  ) {
    await this.characterChatService.removeSaved(id, campaignId, authorization);
  }
}
