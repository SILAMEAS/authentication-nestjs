import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { UsersModule } from 'src/users/users.module';
import { TokenService } from './token.service';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AppConfigService, AuthService, EmailService, TokenService],
})
export class AuthModule {}
