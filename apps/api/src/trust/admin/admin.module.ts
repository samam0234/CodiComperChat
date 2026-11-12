import { Module } from '@nestjs/common';
import { AdminGuard } from '../../account/auth/admin.guard.js';
import { AuthModule } from '../../account/auth/auth.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
