import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  parseLogin,
  parsePasswordChange,
  parseProfile,
  parseSignup,
} from './auth.dto.js';
import { AuthGuard, CurrentUserId } from './auth.guard.js';
import { RateLimit } from '../security/rate-limit.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @RateLimit('signup')
  signup(@Body() body: unknown) {
    return this.authService.signup(parseSignup(body));
  }

  @Post('login')
  @HttpCode(200)
  // 같은 이메일을 같은 곳에서 계속 두드리는 것(무차별 대입)과 한 곳에서 이메일을 바꿔 가며 두드리는 것을 모두 막는다
  @RateLimit('login', 'loginIp')
  login(@Body() body: unknown) {
    return this.authService.login(parseLogin(body));
  }

  // 토큰은 상태 없이 서명만 하므로 서버가 지울 세션이 없다. 쿠키 삭제는 웹(Next)이 한다
  @Post('logout')
  @HttpCode(204)
  logout() {}

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUserId() userId: string) {
    const user = await this.authService.getProfile(userId);
    if (!user) throw new NotFoundException('계정을 찾을 수 없습니다.');
    return user;
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  updateMe(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.authService.updateProfile(userId, parseProfile(body));
  }

  @Post('me/password')
  @RateLimit('password')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async changePassword(
    @CurrentUserId() userId: string,
    @Body() body: unknown,
  ) {
    await this.authService.changePassword(userId, parsePasswordChange(body));
  }
}
