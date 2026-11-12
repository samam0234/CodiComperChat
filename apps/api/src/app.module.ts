import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccountModule } from './account/account/account.module.js';
import { AdminModule } from './trust/admin/admin.module.js';
import { CreditsModule } from './billing/credits/credits.module.js';
import { ModelsModule } from './billing/models/models.module.js';
import { OperationsModule } from './play/operations/operations.module.js';
import { QuestsModule } from './play/quests/quests.module.js';
import { AgentChatModule } from './trust/agent-chat/agent-chat.module.js';
import { AuthModule } from './account/auth/auth.module.js';
import { BillingModule } from './billing/billing/billing.module.js';
import { CampaignsModule } from './chat/campaigns/campaigns.module.js';
import { CharacterChatModule } from './chat/character-chat/character-chat.module.js';
import { CharactersModule } from './chat/characters/characters.module.js';
import { ConversationsModule } from './chat/conversations/conversations.module.js';
import { HealthModule } from './core/health/health.module.js';
import { MailModule } from './core/mail/mail.module.js';
import { PersonasModule } from './chat/personas/personas.module.js';
import { PrismaModule } from './core/prisma/prisma.module.js';
import { ContentReportsModule } from './trust/content-reports/content-reports.module.js';
import { ReportsModule } from './trust/reports/reports.module.js';
import { SupportModule } from './trust/support/support.module.js';
import { RateLimitGuard } from './core/security/rate-limit.js';
import { StudioModule } from './studio/studio/studio.module.js';
import { WorldsModule } from './worlds/worlds/worlds.module.js';

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
    WorldsModule,
    ReportsModule,
    SupportModule,
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
  // 요청 한도: @RateLimit이 붙은 라우트만 센다 (apps/api/src/core/security/rate-limit.ts)
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
