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
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'Sintara CRM <onboarding@resend.dev>';

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

    const subject = `${inviterName} приглашает вас в ${organizationName}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f17; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto;">

    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://www.sintara-crm.com/logo.png" alt="Sintara CRM" style="height: 140px; width: auto;" />
    </div>

    <!-- Main Card -->
    <div style="background: linear-gradient(180deg, #12121c 0%, #16162a 100%); border-radius: 24px; padding: 40px; border: 1px solid rgba(255,255,255,0.08);">

      <!-- Avatar -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); border-radius: 50%; line-height: 64px; font-size: 24px; font-weight: 600; color: #ffffff;">
          ${inviterName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      </div>

      <!-- Title -->
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 8px; letter-spacing: -0.5px;">
        Вас пригласили в команду
      </h1>

      <p style="color: #9ca3af; font-size: 16px; text-align: center; margin: 0 0 32px; line-height: 1.5;">
        <span style="color: #ffffff; font-weight: 600;">${inviterName}</span> приглашает вас<br>
        присоединиться к <span style="color: #ffffff; font-weight: 600;">${organizationName}</span>
      </p>

      <!-- Role Badge -->
      <div style="text-align: center; margin-bottom: 32px;">
        <span style="display: inline-block; background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
          ${roleNames[role] || role}
        </span>
      </div>

      <!-- CTA Button -->
      <div style="margin-bottom: 32px;">
        <a href="${inviteUrl}" style="display: block; width: 100%; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 32px; border-radius: 14px; font-weight: 600; font-size: 16px; text-align: center; box-sizing: border-box;">
          Принять приглашение
        </a>
      </div>

      <!-- Expiry -->
      <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
        Ссылка действительна до ${expiresAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #4b5563; font-size: 12px; margin: 0 0 8px;">
        Если вы не ожидали это приглашение, просто проигнорируйте письмо.
      </p>
      <p style="color: #374151; font-size: 11px; margin: 0;">
        © ${new Date().getFullYear()} Sintara CRM
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
