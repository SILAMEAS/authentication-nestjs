import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  constructor(private readonly appConfigService: AppConfigService) {
    this.resend = new Resend(this.appConfigService.resentApiKey);
  }
  async verifyEmail(email: string, token: string) {
    const appUrl = this.appConfigService.appUrl;

    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    console.log('verificationUrl : ', verificationUrl);

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email',
      html: `<h2>Welcome! Please verify your email</h2>
              <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
              <a href="${verificationUrl}"> verify email</a>
              <p>If you didn't create an account, you can safely ignore this email</p>`,
    });
  }

  async resetPassword(email: string, token: string) {
    const appUrl = this.appConfigService.appUrl;

    const resetPasswordUrl = `${appUrl}/api/auth/reset-password?token=${token}`;
    console.log('resetPasswordUrl : ', resetPasswordUrl);
    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset your password',
      html: `<h2>Welcome! Please reset your password</h2>
              <p>Click the link below to reset your password. This link expires in 1hour.</p>
              <a href="${resetPasswordUrl}"> reset password</a>
              <p>If you didn't reset password, you can safely ignore this email</p>`,
    });
  }
}
