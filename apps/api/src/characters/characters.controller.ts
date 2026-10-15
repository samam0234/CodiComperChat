import { Controller, Get, Headers, Param } from '@nestjs/common';
import { verifyToken } from '../auth/token.js';
import { CharactersService } from './characters.service.js';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findPublished() {
    return this.charactersService.findPublished();
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
