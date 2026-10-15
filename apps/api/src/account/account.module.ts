import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StudioModule } from '../studio/studio.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

@Module({
  imports: [AuthModule, StudioModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
