import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class StudioService {
  createDraft(): never {
    throw new NotImplementedException(
      '캐릭터 초안 생성은 아직 구현되지 않았다 (기획서 10장 8번, 공방 7단계)',
    );
  }

  updateDraft(characterId: string): never {
    throw new NotImplementedException(
      `캐릭터 초안 수정은 아직 구현되지 않았다 (요청 id: ${characterId})`,
    );
  }

  test(characterId: string): never {
    throw new NotImplementedException(
      `3턴 테스트는 아직 구현되지 않았다. FastAPI /critique-test 호출이 여기 들어간다 (요청 id: ${characterId})`,
    );
  }

  publish(characterId: string): never {
    throw new NotImplementedException(
      `발행은 아직 구현되지 않았다. 필수 단계(3·4·6)와 테스트 통과를 여기서 막아야 한다 (기획서 6.1장, 요청 id: ${characterId})`,
    );
  }
}
