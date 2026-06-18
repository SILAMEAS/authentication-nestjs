import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { Request } from 'express';
import { AppConfigService } from '../../config/app-config.service';
import { RequestWithUser } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly appConfigService: AppConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }
    let payload: { sub: string; email: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.appConfigService.jwtAccessTokenSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired access token provided',
      );
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    request.user = user;
    return true;
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] =
      (
        request.headers as unknown as Record<string, string>
      ).authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
