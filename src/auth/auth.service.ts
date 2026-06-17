import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { User } from '../db/schema';

import type { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const exist = await this.usersService.findByEmail(registerDto.email);
    if (exist) {
      throw new ConflictException('An Account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      passwordHash,
      token,
      tokenExp,
    });
    await this.emailService.verifyEmail(user.email, token);

    return {
      message: 'Registration successfully registered. Please check your email',
    };
  }

  private async generateToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXP_IN'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXP_IN'),
    });
    return {
      accessToken,
      refreshToken,
    };
  }
  private async saveRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshTokenHash });
  }

  private setRefreshTokenCookies(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });
  }
  async login(dto: LoginDto, res: Response) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    const passwrodMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwrodMatch) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before login');
    }
    const tokens = await this.generateToken(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookies(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
