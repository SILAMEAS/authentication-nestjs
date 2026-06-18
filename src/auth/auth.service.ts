import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';

import type { Response } from 'express';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}
  /** ______ Register  __________ */
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

  /** Verify Email */
  async verifyEmail(token: string, res: Response) {
    const user = await this.usersService.findByToken(token);

    // 1. token not found in DB
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    // 2. already verified → don't treat as error
    if (user.isVerified) {
      return {
        message: 'Email already verified',
      };
    }

    // 3. expired token
    if (user.tokenExp && user.tokenExp < new Date()) {
      throw new ConflictException('Verification expired');
    }

    // 4. verify user
    await this.usersService.update(user.id, {
      isVerified: true,
      token: null,
      tokenExp: null,
    });

    const tokens = await this.tokenService.generateToken(user);

    await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

    this.tokenService.setRefreshTokenCookies(res, tokens.refreshToken);

    return {
      message: 'Email verified successfully.',
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /** ______ Login  __________ */
  async login(dto: LoginDto, res: Response) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before login');
    }
    const tokens = await this.tokenService.generateToken(user);
    await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);
    this.tokenService.setRefreshTokenCookies(res, tokens.refreshToken);

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

  /** Refresh Token */
  async refreshToken(refresh_token: string, res: Response) {
    if (!refresh_token) {
      throw new UnauthorizedException('Refresh token not found');
    }
    /** verify refresh token */
    const payload = await this.tokenService.verifyRefreshToken(refresh_token);

    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenMatch = await bcrypt.compare(
      refresh_token,
      user.refreshTokenHash,
    );

    if (!tokenMatch) {
      throw new UnauthorizedException('Invalid  refresh token');
    }
    const tokens = await this.tokenService.generateToken(user);

    await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);
    this.tokenService.setRefreshTokenCookies(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
    };
  }
  /** logout */
  async logout(userId: string, res: Response) {
    await this.usersService.update(userId, { refreshTokenHash: null });
    this.tokenService.removeRefreshTokenCookies(res);
    return { message: 'logout successfully' };
  }
  /** forgotPassword */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message: 'If an account exist with this email reset link has been sent',
      };
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1hours

    await this.usersService.update(user.id, {
      resetToken,
      resetTokenExp,
    });
    await this.emailService.resetPassword(email, resetToken);

    return {
      message: 'If an account exist with this email reset link has been sent',
    };
  }
  /** resetPassword */
  async resetPassword(resetToken: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(resetToken);

    if (!user || !user?.resetToken) {
      throw new NotFoundException('Invalid reset token');
    }
    if (user?.resetTokenExp && user?.resetTokenExp < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.usersService.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExp: null,
    });

    return {
      message: 'Password reset successfully',
    };
  }
}
