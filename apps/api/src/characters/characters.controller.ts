import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { verifyToken } from '../auth/token.js';
import { CharactersService } from './characters.service.js';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findPublished() {
    return this.charactersService.findPublished();
  }

  // 흉상 초상 이미지. 공개·링크 공개는 누구나(캐시 가능), 비공개는 만든 사람만(캐시하지 않음)
  @Get(':id/portrait')
  async portrait(@Param('id') id: string, @Res() res: Response, @Headers('authorization') authorization?: string) {
    const [scheme, token] = authorization?.split(' ') ?? [];
    const viewerId = scheme === 'Bearer' && token ? await verifyToken(token) : null;
    const image = await this.charactersService.portrait(id, viewerId);
    res.setHeader('Content-Type', image.mime);
    res.setHeader('Cache-Control', image.visibility === 'PRIVATE' ? 'private, no-store' : 'public, max-age=300');
    // 그림 안에 스크립트가 들어 있어도 실행되지 않게
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.send(image.data);
  }

  // 로그인 없이도 공개·링크 공개 캐릭터는 본다. 토큰이 있으면 내 비공개 캐릭터도 보인다
  @Get(':id')
  async findOne(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const [scheme, token] = authorization?.split(' ') ?? [];
    const viewerId = scheme === 'Bearer' && token ? await verifyToken(token) : null;
    const character = await this.charactersService.findOnePublished(id, viewerId);
    return { ...character, ...(await this.charactersService.origin(id, viewerId)) };
  }
}
