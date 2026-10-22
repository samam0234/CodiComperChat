import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CharactersModule } from '../characters/characters.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { ChatExtrasController, ExtrasController } from './extras.controller.js';
import { ExtrasService } from './extras.service.js';

@Module({
  imports: [AuthModule, CharactersModule, ConversationsModule],
  controllers: [ExtrasController, ChatExtrasController],
  providers: [ExtrasService],
  exports: [ExtrasService],
})
export class ExtrasModule {}
