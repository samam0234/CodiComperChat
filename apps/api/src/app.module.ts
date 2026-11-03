import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccountModule } from './account/account.module.js';
import { AdminModule } from './admin/admin.module.js';
import { CreditsModule } from './credits/credits.module.js';
import { ModelsModule } from './models/models.module.js';
import { OperationsModule } from './operations/operations.module.js';
import { QuestsModule } from './quests/quests.module.js';
import { AgentChatModule } from './agent-chat/agent-chat.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BillingModule } from './billing/billing.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { CharacterChatModule } from './character-chat/character-chat.module.js';
import { CharactersModule } from './characters/characters.module.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { HealthModule } from './health/health.module.js';
import { MailModule } from './mail/mail.module.js';
import { PersonasModule } from './personas/personas.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ContentReportsModule } from './content-reports/content-reports.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { RateLimitGuard } from './security/rate-limit.js';
import { StudioModule } from './studio/studio.module.js';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    HealthModule,
    AuthModule,
    PersonasModule,
    CharactersModule,
    ConversationsModule,
    CharacterChatModule,
    CampaignsModule,
    StudioModule,
    ReportsModule,
    ContentReportsModule,
    AgentChatModule,
    BillingModule,
    AccountModule,
    AdminModule,
    ModelsModule,
    CreditsModule,
    OperationsModule,
    QuestsModule,
  ],
  // 요청 한도: @RateLimit이 붙은 라우트만 센다 (apps/api/src/security/rate-limit.ts)
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
