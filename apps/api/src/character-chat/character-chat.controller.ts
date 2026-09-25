import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { CharacterChatService } from './character-chat.service.js';
import type { ChatTurn } from './character-chat.types.js';

type SendChatBody = {
  message?: string;
  history?: ChatTurn[];
  personaId?: unknown;
};

@Controller('characters/:id/chat')
export class CharacterChatController {
  constructor(private readonly characterChatService: CharacterChatService) {}

  @Post()
  send(
    @Param('id') id: string,
    @Body() body: SendChatBody,
    @Headers('authorization') authorization?: string,
  ) {
    if (typeof body.message !== 'string' || body.message.trim() === '') {
      throw new BadRequestException('message가 비어 있다');
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const personaId =
      typeof body.personaId === 'string' && body.personaId !== ''
        ? body.personaId
        : null;

    return this.characterChatService.send(id, body.message.trim(), history, {
      personaId,
      authorization,
    });
  }
}
