import { Controller, Get } from '@nestjs/common';
import { aiQueue } from '../ai/ai-queue.js';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      // AI 호출 대기열 상태: 지금 처리 중인 수와 기다리는 수(과부하를 눈으로 확인하는 용도)
      ai: aiQueue.stats(),
    };
  }
}
