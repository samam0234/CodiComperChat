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
  parseEmailOnly,
  parseLogin,
  parsePasswordChange,
  parsePasswordReset,
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

  // 다른 기기의 로그인은 끊기고, 지금 기기는 돌려받은 새 토큰으로 이어 간다
  @Post('me/password')
  @RateLimit('password')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  changePassword(
    @CurrentUserId() userId: string,
    @Body() body: unknown,
  ) {
    return this.authService.changePassword(userId, parsePasswordChange(body));
  }

  // 인증 메일 다시 보내기
  @Post('me/verify-email')
  @RateLimit('mail')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  requestVerification(@CurrentUserId() userId: string) {
    return this.authService.requestVerification(userId);
  }

  // 메일 속 링크의 토큰으로 인증을 끝낸다. 다른 기기에서 메일을 열 수 있으니 로그인은 요구하지 않는다
  @Post('verify-email')
  @RateLimit('emailToken')
  @HttpCode(200)
  verifyEmail(@Body() body: { token?: unknown } | undefined) {
    return this.authService.verifyEmail(body?.token);
  }

  // 비밀번호 찾기: 재설정 링크를 메일로 보낸다. 가입 여부와 상관없이 항상 204
  @Post('password/forgot')
  @RateLimit('forgot', 'forgotIp')
  @HttpCode(204)
  async forgotPassword(@Body() body: unknown) {
    await this.authService.forgotPassword(parseEmailOnly(body));
  }

  @Post('password/reset')
  @RateLimit('emailToken')
  @HttpCode(204)
  async resetPassword(@Body() body: unknown) {
    await this.authService.resetPassword(parsePasswordReset(body));
  }
}
