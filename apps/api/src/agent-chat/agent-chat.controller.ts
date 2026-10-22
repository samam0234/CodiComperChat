import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RateLimit } from '../security/rate-limit.js';
import { AgentChatService, sanitizeHistory } from './agent-chat.service.js';

const MESSAGE_LIMIT = 2000;

@Controller('agent-chat')
export class AgentChatController {
  constructor(private readonly agentChatService: AgentChatService) {}

  @Post('messages')
  @RateLimit('agent')
  @HttpCode(200)
  send(@Body() body: { message?: unknown; history?: unknown }) {
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (message === '') {
      throw new BadRequestException('message가 비어 있다');
    }
    if (message.length > MESSAGE_LIMIT) {
      throw new BadRequestException(`메시지는 ${MESSAGE_LIMIT}자 이하로 보내 주세요.`);
    }

    return this.agentChatService.send(message, sanitizeHistory(body.history));
  }
}
