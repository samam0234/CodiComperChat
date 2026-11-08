import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { RateLimit } from '../security/rate-limit.js';
import { SupportService } from './support.service.js';

@Controller('support/inquiries')
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('categories')
  categories() {
    return this.support.categories();
  }

  @Get()
  mine(@CurrentUserId() userId: string) {
    return this.support.mine(userId);
  }

  @Post()
  @HttpCode(201)
  @RateLimit('support')
  create(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.support.create(userId, body);
  }
}

@Controller('admin/support-inquiries')
@UseGuards(AuthGuard, AdminGuard)
export class AdminSupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  queue() {
    return this.support.queue();
  }

  @Post(':id/reply')
  @HttpCode(204)
  reply(@Param('id') id: string, @Body() body: { reply?: unknown }) {
    return this.support.reply(id, body?.reply);
  }
}
