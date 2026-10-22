import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { ModelsService } from './models.service.js';

@Controller('models')
@UseGuards(AuthGuard)
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  // 대화에서 고를 수 있는 모델과, 지금 이 계정이 쓸 수 있는지·오늘 몇 번 썼는지
  @Get()
  list(@CurrentUserId() userId: string) {
    return this.models.list(userId);
  }
}
