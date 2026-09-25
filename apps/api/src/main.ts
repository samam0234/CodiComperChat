import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { assertAuthSecret } from './auth/token.js';

async function bootstrap() {
  assertAuthSecret();
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
