import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { assertAuthSecret } from './auth/token.js';

async function bootstrap() {
  assertAuthSecret();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 공방 초상 업로드는 이미지 원본 그대로 받는다(JSON/base64가 아님). 상한은 컨트롤러가 다시 검사한다
  app.useBodyParser('raw', { type: ['image/webp', 'image/jpeg', 'image/png'], limit: '300kb' });
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
