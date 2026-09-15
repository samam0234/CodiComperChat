import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class CharactersService {
  findPublished(): never {
    throw new NotImplementedException(
      '발행된 캐릭터 목록은 아직 구현되지 않았다 (Prisma 스키마 이후, 기획서 10장 2~3번)',
    );
  }
}
