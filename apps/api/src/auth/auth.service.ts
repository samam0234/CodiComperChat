import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(): never {
    throw new NotImplementedException(
      '로그인은 아직 구현되지 않았다 (인증 벤더 미정, 기획서 7.8장)',
    );
  }

  logout(): never {
    throw new NotImplementedException('로그아웃은 아직 구현되지 않았다');
  }
}
