import { Module } from '@nestjs/common';
import { CharactersModule } from '../characters/characters.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { PersonaRagModule } from '../persona-rag/persona-rag.module.js';
import { PersonasModule } from '../personas/personas.module.js';
import { CharacterChatController } from './character-chat.controller.js';
import { CharacterChatService } from './character-chat.service.js';

@Module({
  imports: [CharactersModule, PersonasModule, PersonaRagModule, ConversationsModule],
  controllers: [CharacterChatController],
  providers: [CharacterChatService],
})
export class CharacterChatModule {}
