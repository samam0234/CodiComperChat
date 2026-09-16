import { BadRequestException, Body, Controller, Param, Post } from '@nestjs/common';
import { CharacterChatService } from './character-chat.service.js';
import type { ChatTurn } from './character-chat.types.js';

type SendChatBody = {
  message?: string;
  history?: ChatTurn[];
};

@Controller('characters/:id/chat')
export class CharacterChatController {
  constructor(private readonly characterChatService: CharacterChatService) {}

  @Post()
  send(@Param('id') id: string, @Body() body: SendChatBody) {
    if (typeof body.message !== 'string' || body.message.trim() === '') {
      throw new BadRequestException('message가 비어 있다');
    }

    const history = Array.isArray(body.history) ? body.history : [];

    return this.characterChatService.send(id, body.message.trim(), history);
  }
}
