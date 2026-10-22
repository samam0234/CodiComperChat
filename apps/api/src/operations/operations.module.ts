import { Module } from '@nestjs/common';
import { CharacterChatModule } from '../character-chat/character-chat.module.js';
import { CharactersModule } from '../characters/characters.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { CreditsModule } from '../credits/credits.module.js';
import { OperationsController } from './operations.controller.js';
import { OperationsService } from './operations.service.js';

@Module({
  imports: [CharacterChatModule, CharactersModule, ConversationsModule, CreditsModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
