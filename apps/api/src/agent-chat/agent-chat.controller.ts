import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AgentChatService } from './agent-chat.service.js';

@Controller('agent-chat')
export class AgentChatController {
  constructor(private readonly agentChatService: AgentChatService) {}

  @Post('messages')
  send(@Body('message') message?: string) {
    if (typeof message !== 'string' || message.trim() === '') {
      throw new BadRequestException('message가 비어 있다');
    }

    return this.agentChatService.send(message.trim());
  }
}
