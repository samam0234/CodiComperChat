import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { assertAuthSecret } from './auth/token.js';
import { httpsEnforcement } from './security/https.js';
import { assertProductionSafety } from './security/production.js';

async function bootstrap() {
  assertAuthSecret();
  assertProductionSafety();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 응답이 어떤 서버인지 알려 주지 않는다
  app.disable('x-powered-by');
  // 웹 서버(같은 기계·사설망)가 넘긴 X-Forwarded-For의 실제 이용자 IP만 믿는다. 공개 주소에서 온 요청이 이 헤더로 IP를 꾸미지 못한다
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  // trust proxy 다음에 둔다. 공개 호스트의 운영 서버는 https만 받고, https 응답에 HSTS를 붙인다
  app.use(httpsEnforcement);
  // 이 API는 JSON·이미지만 내보내는 서버다: 브라우저가 내용을 추측해 실행하거나, 다른 사이트의 프레임에 끼우거나,
  // 주소를 Referer로 흘리지 못하게 한다
  app.use((_req: unknown, res: { setHeader(name: string, value: string): void }, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  // 공방 초상 업로드는 이미지 원본 그대로 받는다(JSON/base64가 아님). 상한은 컨트롤러가 다시 검사한다
  app.useBodyParser('raw', { type: ['image/webp', 'image/jpeg', 'image/png'], limit: '300kb' });
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
