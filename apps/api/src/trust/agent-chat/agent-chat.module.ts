import { Module } from '@nestjs/common';
import { AgentChatController } from './agent-chat.controller.js';
import { AgentChatService } from './agent-chat.service.js';

@Module({
  controllers: [AgentChatController],
  providers: [AgentChatService],
})
export class AgentChatModule {}
