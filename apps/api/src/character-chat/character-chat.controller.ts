import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { CharacterChatService } from './character-chat.service.js';
import type { ChatTurn } from './character-chat.types.js';

const MESSAGE_LIMIT = 2000;
const HISTORY_LIMIT = 30;
const TURN_LIMIT = 4000;
const AVOID_LIMIT = 12;

type ChatBody = {
  message?: unknown;
  history?: unknown;
  personaId?: unknown;
  avoid?: unknown;
};

function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is ChatTurn =>
        typeof t === 'object' &&
        t !== null &&
        (t.role === 'user' || t.role === 'character') &&
        typeof t.text === 'string' &&
        t.text.trim() !== '',
    )
    .slice(-HISTORY_LIMIT)
    .map((t) => ({ role: t.role, text: t.text.slice(0, TURN_LIMIT) }));
}

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

    return this.characterChatService.send(id, message, sanitizeHistory(body.history), {
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

    return this.characterChatService.suggest(id, sanitizeHistory(body?.history), avoid, {
      personaId: requirePersonaId(body?.personaId),
      authorization,
    });
  }
}
