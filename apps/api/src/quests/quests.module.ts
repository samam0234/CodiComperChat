import { Module } from '@nestjs/common';
import { CharactersModule } from '../characters/characters.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { CreditsModule } from '../credits/credits.module.js';
import { QuestsController } from './quests.controller.js';
import { QuestsService } from './quests.service.js';

@Module({
  imports: [CharactersModule, ConversationsModule, CreditsModule],
  controllers: [QuestsController],
  providers: [QuestsService],
  exports: [QuestsService],
})
export class QuestsModule {}
