import { Module } from '@nestjs/common';
import { AgentChatModule } from './agent-chat/agent-chat.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { CharacterChatModule } from './character-chat/character-chat.module.js';
import { CharactersModule } from './characters/characters.module.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { HealthModule } from './health/health.module.js';
import { PersonasModule } from './personas/personas.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StudioModule } from './studio/studio.module.js';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    PersonasModule,
    CharactersModule,
    ConversationsModule,
    CharacterChatModule,
    CampaignsModule,
    StudioModule,
    AgentChatModule,
  ],
})
export class AppModule {}
