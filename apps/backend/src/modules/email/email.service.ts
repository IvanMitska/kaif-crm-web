import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'KAIF CRM <onboarding@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      this.logger.warn('RESEND_API_KEY not set - emails will only be logged');
    }
  }

  async sendInvitationEmail(params: {
    to: string;
    inviterName: string;
    organizationName: string;
    role: string;
    inviteUrl: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const { to, inviterName, organizationName, role, inviteUrl, expiresAt } = params;

    const roleNames: Record<string, string> = {
      OWNER: 'Владелец',
      ADMIN: 'Администратор',
      MANAGER: 'Менеджер',
      OPERATOR: 'Оператор',
    };

    const subject = `Приглашение в ${organizationName} - KAIF CRM`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">KAIF CRM</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1f2937; margin: 0 0 16px;">Вас пригласили в команду!</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        <strong>${inviterName}</strong> приглашает вас присоединиться к организации
        <strong>${organizationName}</strong> в роли <strong>${roleNames[role] || role}</strong>.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Принять приглашение
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0;">
        Ссылка действительна до ${expiresAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Если вы не ожидали это приглашение, просто проигнорируйте это письмо.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Log for debugging
    this.logger.log(`Sending invitation email to ${to}`);

    if (!this.resend) {
      this.logger.warn(`
========== INVITATION EMAIL (NOT SENT - NO API KEY) ==========
To: ${to}
Subject: ${subject}
Invite URL: ${inviteUrl}
==============================================================
      `);
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`);
        return false;
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Email sending error: ${error}`);
      return false;
    }
  }
}
