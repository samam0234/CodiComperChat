import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RateLimit } from '../security/rate-limit.js';
import { PHOTONET_PROMPT_MAX, PHOTONET_RATINGS, type PhotonetRating } from './operations.service.js';
import { WebtoonService, parsePanelCount } from './webtoon.service.js';

// 웹툰 (오퍼레이션): 콘티는 무료, 컷은 하나씩 45 코레딧. 로그인한 사람만, 진행 중인 대화가 있어야 만든다
@Controller('characters/:id/chat/ops/webtoon')
export class WebtoonController {
  constructor(private readonly webtoons: WebtoonService) {}

  // 값·잔액·엔진 상태·성인 모드 가능 여부·최근 웹툰
  @Get()
  view(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.webtoons.view(id, authorization);
  }

  // 콘티 만들기 { prompt?, messageId?, panels(2~6), rating? } — 그림은 그리지 않는다. 장면 설명을 비우면 최근 대화를 그린다
  @Post()
  @HttpCode(200)
  @RateLimit('webtoonPlan')
  create(
    @Param('id') id: string,
    @Body() body: { prompt?: unknown; messageId?: unknown; panels?: unknown; rating?: unknown },
    @Headers('authorization') authorization?: string,
  ) {
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const messageId = typeof body?.messageId === 'string' && body.messageId !== '' ? body.messageId.slice(0, 40) : undefined;
    if (prompt.length > PHOTONET_PROMPT_MAX) throw new BadRequestException(`장면 설명은 ${PHOTONET_PROMPT_MAX}자 이하로 적어 주세요.`);
    const rating = (body?.rating ?? 'sfw') as PhotonetRating;
    if (!(PHOTONET_RATINGS as readonly unknown[]).includes(rating)) throw new BadRequestException('알 수 없는 수위입니다.');
    return this.webtoons.create(id, { prompt, messageId, panels: parsePanelCount(body?.panels), rating }, authorization);
  }

  // 컷 하나 그리기 (45 코레딧, 못 그리면 돌려준다)
  @Post(':webtoonId/panels/:index')
  @HttpCode(200)
  @RateLimit('webtoonPanel')
  draw(
    @Param('id') id: string,
    @Param('webtoonId') webtoonId: string,
    @Param('index', ParseIntPipe) index: number,
    @Headers('authorization') authorization?: string,
  ) {
    return this.webtoons.drawPanel(id, webtoonId, index, authorization);
  }

  // 컷 그림 본문 (그 대화를 하는 사람에게만, 캐시하지 않음)
  @Get(':webtoonId/panels/:index')
  async image(
    @Param('id') id: string,
    @Param('webtoonId') webtoonId: string,
    @Param('index', ParseIntPipe) index: number,
    @Res() res: Response,
    @Headers('authorization') authorization?: string,
  ) {
    const image = await this.webtoons.panelImage(id, webtoonId, index, authorization);
    res.setHeader('Content-Type', image.mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(image.data);
  }
}
