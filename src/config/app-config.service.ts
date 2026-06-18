import { ConfigService } from '@nestjs/config';
import { Env } from './env';
import { Injectable } from '@nestjs/common';
import type { StringValue } from 'ms';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get databaseUrl(): string {
    return this.config.getOrThrow('DATABASE_URL');
  }

  get jwtAccessTokenSecret(): string {
    return this.config.getOrThrow('JWT_ACCESS_SECRET');
  }

  get jwtAccessTokenSecretExpIn(): StringValue {
    return this.config.getOrThrow('JWT_ACCESS_EXP_IN');
  }

  get jwtRefreshTokenSecret(): string {
    return this.config.getOrThrow('JWT_REFRESH_SECRET');
  }

  get jwtRefreshTokenSecretExpIn(): StringValue {
    return this.config.getOrThrow('JWT_REFRESH_EXP_IN');
  }

  get resentApiKey(): string {
    return this.config.getOrThrow('RESENT_API_KEY');
  }

  get appUrl(): string {
    return this.config.getOrThrow('APP_URL');
  }

  get port(): string {
    return this.config.getOrThrow('PORT');
  }
}
