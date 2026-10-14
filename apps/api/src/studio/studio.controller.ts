import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { StudioService } from './studio.service.js';

// 캐릭터 공방 (기획서 §6). 초안 만들기·고치기는 로그인한 누구나, 발행은 운영자만
@Controller('studio/characters')
@UseGuards(AuthGuard)
export class StudioController {
  constructor(private readonly studio: StudioService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.studio.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string) {
    return this.studio.create(userId);
  }

  @Get(':id')
  get(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.studio.get(userId, id);
  }

  @Patch(':id')
  save(@CurrentUserId() userId: string, @Param('id') id: string, @Body() body: { card?: unknown }) {
    return this.studio.save(userId, id, body?.card);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.studio.remove(userId, id);
  }
}
