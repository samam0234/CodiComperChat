import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CharactersModule } from '../characters/characters.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { ChatStateController } from './chat-state.controller.js';
import { ChatStateService } from './chat-state.service.js';

@Module({
  imports: [AuthModule, CharactersModule, ConversationsModule],
  controllers: [ChatStateController],
  providers: [ChatStateService],
  exports: [ChatStateService],
})
export class ChatStateModule {}
