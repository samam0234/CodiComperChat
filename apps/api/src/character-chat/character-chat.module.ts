import { Module } from '@nestjs/common';
import { CharactersModule } from '../characters/characters.module.js';
import { CharacterChatController } from './character-chat.controller.js';
import { CharacterChatService } from './character-chat.service.js';

@Module({
  imports: [CharactersModule],
  controllers: [CharacterChatController],
  providers: [CharacterChatService],
})
export class CharacterChatModule {}
