import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { User } from '../drizzle/schema';
import * as bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class TokenService {
  public readonly cookies_refresh_token = 'refresh_token';
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /** ______ Generate Token __________ */
  public async generateToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.appConfigService.jwtAccessTokenSecret,
      expiresIn: this.appConfigService.jwtAccessTokenSecretExpIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.appConfigService.jwtRefreshTokenSecret,
      expiresIn: this.appConfigService.jwtRefreshTokenSecretExpIn,
    });
    return {
      accessToken,
      refreshToken,
    };
  }
  /** ______ Save Refresh Token __________ */
  public async saveRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshTokenHash });
  }
  /** ______ Set Refresh Token to Cookies __________ */
  public setRefreshTokenCookies(res: Response, refreshToken: string) {
    res.cookie(this.cookies_refresh_token, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
  /** ______ Clear Token from Cookies __________ */
  public removeRefreshTokenCookies(res: Response) {
    res.clearCookie(this.cookies_refresh_token);
  }

  /** ______ verify refresh token  __________ */
  public async verifyRefreshToken(refresh_token: string) {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refresh_token, {
        secret: this.appConfigService.jwtRefreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return payload;
  }
}
