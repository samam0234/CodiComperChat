import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CharactersService } from '../characters/characters.service.js';
import { buildContextSlice } from './character-chat.context.js';
import type { ChatTurn } from './character-chat.types.js';

@Injectable()
export class CharacterChatService {
  constructor(private readonly charactersService: CharactersService) {}

  async send(characterId: string, userTurn: string, history: ChatTurn[]) {
    // 발행 안 됐거나 없는 캐릭터면 여기서 NotFoundException을 던진다.
    const character = await this.charactersService.findOnePublished(characterId);

    const aiBaseUrl = process.env.AI_BASE_URL ?? 'http://localhost:8000';
    const payload = {
      context: buildContextSlice(character, history),
      userTurn,
    };

    let res: Response;
    try {
      res = await fetch(`${aiBaseUrl}/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ServiceUnavailableException(
        `${aiBaseUrl}에 연결할 수 없습니다. services/ai가 켜져 있는지 확인하세요.`,
      );
    }

    const data = await res.json();

    if (!res.ok) {
      throw new HttpException(data?.detail ?? '추론 요청이 실패했다', res.status);
    }

    return data as { reply: string };
  }
}
