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
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: unknown) {
    return this.authService.signup(parseSignup(body));
  }

  @Post('login')
  @HttpCode(200)
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
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async changePassword(
    @CurrentUserId() userId: string,
    @Body() body: unknown,
  ) {
    await this.authService.changePassword(userId, parsePasswordChange(body));
  }
}
