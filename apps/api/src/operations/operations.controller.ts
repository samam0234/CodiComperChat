import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RateLimit } from '../security/rate-limit.js';
import {
  DM_MAX_LENGTH,
  OperationsService,
  PHOTONET_PROMPT_MAX,
  PHOTONET_RATIOS,
  PHOTONET_STYLES,
  POST_BODY_MAX,
  POST_TITLE_MAX,
} from './operations.service.js';

// 오퍼레이션: 이 캐릭터와의 지금 대화에 붙는 플러그인. 로그인한 사람만, 진행 중인 대화가 있어야 만들 수 있다
@Controller('characters/:id/chat/ops')
export class OperationsController {
  constructor(private readonly ops: OperationsService) {}

  // 심리 탐구: 지금까지 엿본 속마음 목록 + 값·잔액
  @Get('mind')
  mind(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.mindView(id, authorization);
  }

  // 심리 탐구: 지금 이 순간의 속마음을 엿본다 (코레딧)
  @Post('mind')
  @HttpCode(200)
  @RateLimit('chat')
  readMind(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.readMind(id, authorization);
  }

  // 일기: 캐릭터가 쓴 일기 목록 + 값·잔액
  @Get('diary')
  diary(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.diaryView(id, authorization);
  }

  // 일기: 최근 대화를 돌아보는 새 일기 한 편 (코레딧)
  @Post('diary')
  @HttpCode(200)
  @RateLimit('chat')
  writeDiary(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.writeDiary(id, authorization);
  }

  // 메시지: 문자 기록
  @Get('messages')
  messages(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.messagesView(id, authorization);
  }

  // 메시지: 문자 보내기 { text } → 캐릭터 답장 (코레딧 없음)
  @Post('messages')
  @HttpCode(200)
  @RateLimit('chat')
  sendMessage(@Param('id') id: string, @Body() body: { text?: unknown }, @Headers('authorization') authorization?: string) {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (text === '') throw new BadRequestException('보낼 문자를 적어 주세요.');
    if (text.length > DM_MAX_LENGTH) throw new BadRequestException(`문자는 ${DM_MAX_LENGTH}자 이하로 보내 주세요.`);
    return this.ops.sendMessage(id, text, authorization);
  }

  // 커뮤니티: 게시판 (캐릭터 세계 속 가상 익명 게시판, 나에게만 보인다)
  @Get('board')
  board(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.boardView(id, authorization);
  }

  // 커뮤니티: 새 글 불러오기 — 주민 글 3개 (코레딧)
  @Post('board/refresh')
  @HttpCode(200)
  @RateLimit('chat')
  refreshBoard(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.refreshBoard(id, authorization);
  }

  // 커뮤니티: 내 글 쓰기 { title, body, anonymous } — 주민 댓글 포함 (코레딧)
  @Post('board/posts')
  @HttpCode(200)
  @RateLimit('chat')
  writePost(
    @Param('id') id: string,
    @Body() body: { title?: unknown; body?: unknown; anonymous?: unknown },
    @Headers('authorization') authorization?: string,
  ) {
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const text = typeof body?.body === 'string' ? body.body.trim() : '';
    if (title === '' || text === '') throw new BadRequestException('제목과 내용을 적어 주세요.');
    if (title.length > POST_TITLE_MAX) throw new BadRequestException(`제목은 ${POST_TITLE_MAX}자 이하로 적어 주세요.`);
    if (text.length > POST_BODY_MAX) throw new BadRequestException(`내용은 ${POST_BODY_MAX}자 이하로 적어 주세요.`);
    // 기본은 익명. 실명(내 주인공 이름)으로 쓰려면 anonymous: false
    return this.ops.writePost(id, { title, body: text, anonymous: body?.anonymous !== false }, authorization);
  }

  // 코디포토넷: 엔진 준비 여부·값·고를 수 있는 화풍과 비율·만든 그림
  @Get('photonet')
  photonet(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.photonetView(id, authorization);
  }

  // 코디포토넷: 만든 그림 본문 (그 대화를 하는 사람에게만, 캐시하지 않음)
  @Get('photonet/:imageId')
  async photonetImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Res() res: Response,
    @Headers('authorization') authorization?: string,
  ) {
    const image = await this.ops.photonetImage(id, imageId, authorization);
    res.setHeader('Content-Type', image.mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(image.data);
  }

  // 코디포토넷: 그림 만들기 { prompt, style, ratio } — 엔진이 꺼져 있으면 503 (코레딧을 빼지 않는다)
  @Post('photonet')
  @HttpCode(200)
  @RateLimit('photonet')
  createPhotonet(
    @Param('id') id: string,
    @Body() body: { prompt?: unknown; style?: unknown; ratio?: unknown; messageId?: unknown },
    @Headers('authorization') authorization?: string,
  ) {
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    // 그릴 대사를 골랐으면 장면 설명은 없어도 된다
    const messageId = typeof body?.messageId === 'string' && body.messageId !== '' ? body.messageId.slice(0, 40) : undefined;
    if (prompt === '' && !messageId) throw new BadRequestException('어떤 장면을 그릴지 적거나, 그릴 대사를 골라 주세요.');
    if (prompt.length > PHOTONET_PROMPT_MAX) throw new BadRequestException(`장면 설명은 ${PHOTONET_PROMPT_MAX}자 이하로 적어 주세요.`);
    if (!(PHOTONET_STYLES as readonly unknown[]).includes(body?.style)) throw new BadRequestException('알 수 없는 화풍입니다.');
    if (!(PHOTONET_RATIOS as readonly unknown[]).includes(body?.ratio)) throw new BadRequestException('알 수 없는 비율입니다.');
    return this.ops.createPhotonet(id, { prompt, style: body.style as string, ratio: body.ratio as string, messageId }, authorization);
  }
}
