import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { IntegrationType } from '@prisma/client';
import { ImapFlow } from 'imapflow';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import {
  CreateEmailAccountDto,
  UpdateEmailAccountDto,
  EmailAccountInfoDto,
  TestConnectionDto,
} from './dto/email-account.dto';
import {
  EmailMessageDto,
  EmailListFilterDto,
  SendEmailDto,
  ReplyEmailDto,
  MarkEmailDto,
  LinkEmailToContactDto,
  SyncResultDto,
} from './dto/email-message.dto';

@Injectable()
export class EmailImapService {
  private readonly logger = new Logger(EmailImapService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
  ) {}

  // ============ Account Management ============

  async createAccount(dto: CreateEmailAccountDto, organizationId: string): Promise<EmailAccountInfoDto> {
    // Test connection first
    await this.testConnection({
      email: dto.email,
      password: dto.password,
      imapHost: dto.imapHost,
      imapPort: dto.imapPort,
      imapSecure: dto.imapSecure,
    });

    // Create integration config
    const integration = await this.prisma.integrationConfig.create({
      data: {
        organizationId,
        type: IntegrationType.EMAIL,
        name: dto.name,
        isActive: true,
        credentials: {
          password: dto.password, // In production, encrypt this
        },
        settings: {
          autoLinkContacts: dto.autoLinkContacts ?? true,
        },
      },
    });

    // Create email account
    const emailAccount = await this.prisma.emailAccount.create({
      data: {
        integrationId: integration.id,
        email: dto.email,
        displayName: dto.displayName,
        imapHost: dto.imapHost,
        imapPort: dto.imapPort ?? 993,
        imapSecure: dto.imapSecure ?? true,
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort ?? 587,
        smtpSecure: dto.smtpSecure ?? false,
        syncFolder: dto.syncFolder ?? 'INBOX',
      },
      include: { integration: true },
    });

    this.logger.log(`Email account created: ${dto.email} for organization ${organizationId}`);

    // Trigger initial sync in background
    this.syncAccount(emailAccount.id, organizationId).catch((err) => {
      this.logger.error(`Initial sync failed: ${err.message}`);
    });

    return this.mapToAccountInfo(emailAccount);
  }

  async updateAccount(
    accountId: string,
    dto: UpdateEmailAccountDto,
    organizationId: string,
  ): Promise<EmailAccountInfoDto> {
    const account = await this.findAccount(accountId, organizationId);

    // Update credentials if password changed
    if (dto.password) {
      await this.prisma.integrationConfig.update({
        where: { id: account.integrationId },
        data: {
          credentials: {
            ...(account.integration.credentials as any),
            password: dto.password,
          },
        },
      });
    }

    // Update integration status if changed
    if (dto.isActive !== undefined) {
      await this.prisma.integrationConfig.update({
        where: { id: account.integrationId },
        data: { isActive: dto.isActive },
      });
    }

    const updated = await this.prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        displayName: dto.displayName,
        syncEnabled: dto.syncEnabled,
        syncFolder: dto.syncFolder,
      },
      include: { integration: true },
    });

    return this.mapToAccountInfo(updated);
  }

  async deleteAccount(accountId: string, organizationId: string): Promise<void> {
    const account = await this.findAccount(accountId, organizationId);

    // Delete integration (will cascade delete email account and messages)
    await this.prisma.integrationConfig.delete({
      where: { id: account.integrationId },
    });

    this.logger.log(`Email account deleted: ${accountId}`);
  }

  async getAccounts(organizationId: string): Promise<EmailAccountInfoDto[]> {
    const accounts = await this.prisma.emailAccount.findMany({
      where: {
        integration: {
          organizationId,
          type: IntegrationType.EMAIL,
        },
      },
      include: { integration: true },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((a) => this.mapToAccountInfo(a));
  }

  async getAccount(accountId: string, organizationId: string): Promise<EmailAccountInfoDto> {
    const account = await this.findAccount(accountId, organizationId);
    return this.mapToAccountInfo(account);
  }

  async testConnection(dto: TestConnectionDto): Promise<{ success: boolean; message: string }> {
    const client = new ImapFlow({
      host: dto.imapHost,
      port: dto.imapPort ?? 993,
      secure: dto.imapSecure ?? true,
      auth: {
        user: dto.email,
        pass: dto.password,
      },
      logger: false,
    });

    try {
      await client.connect();
      await client.logout();
      return { success: true, message: 'Подключение успешно' };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`IMAP connection test failed: ${error.message}`);
      throw new BadRequestException(`Ошибка подключения: ${error.message}`);
    }
  }

  // ============ Email Sync ============

  async syncAccount(accountId: string, organizationId: string): Promise<SyncResultDto> {
    const account = await this.findAccount(accountId, organizationId);
    const credentials = account.integration.credentials as any;

    const result: SyncResultDto = {
      success: false,
      accountId,
      newMessages: 0,
      updatedMessages: 0,
      errors: [],
      syncedAt: new Date(),
    };

    if (!account.syncEnabled) {
      result.errors.push('Синхронизация отключена');
      return result;
    }

    const client = new ImapFlow({
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      auth: {
        user: account.email,
        pass: credentials.password,
      },
      logger: false,
    });

    try {
      await client.connect();

      // Select mailbox
      const mailbox = await client.mailboxOpen(account.syncFolder);
      this.logger.log(`Syncing ${account.email}: ${mailbox.exists} messages in ${account.syncFolder}`);

      // Get last synced UID or fetch recent messages
      const lastMessage = await this.prisma.emailMessage.findFirst({
        where: { emailAccountId: accountId },
        orderBy: { uid: 'desc' },
      });

      const searchCriteria = lastMessage?.uid
        ? { uid: `${lastMessage.uid + 1}:*` }
        : { since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // Last 30 days

      // Fetch messages
      for await (const message of client.fetch(searchCriteria, {
        uid: true,
        envelope: true,
        bodyStructure: true,
        source: true,
      })) {
        try {
          const saved = await this.saveEmailMessage(account, message, organizationId);
          if (saved) {
            result.newMessages++;
          }
        } catch (err) {
          const error = err as Error;
          result.errors.push(`Message ${message.uid}: ${error.message}`);
        }
      }

      await client.logout();

      // Update sync status
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: null,
          emailsReceived: { increment: result.newMessages },
        },
      });

      result.success = true;
      this.logger.log(`Sync completed for ${account.email}: ${result.newMessages} new messages`);
    } catch (err) {
      const error = err as Error;
      result.errors.push(error.message);
      this.logger.error(`Sync failed for ${account.email}: ${error.message}`);

      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: error.message,
        },
      });
    }

    return result;
  }

  async syncAllAccounts(organizationId: string): Promise<SyncResultDto[]> {
    const accounts = await this.prisma.emailAccount.findMany({
      where: {
        syncEnabled: true,
        integration: {
          organizationId,
          type: IntegrationType.EMAIL,
          isActive: true,
        },
      },
    });

    const results: SyncResultDto[] = [];
    for (const account of accounts) {
      const result = await this.syncAccount(account.id, organizationId);
      results.push(result);
    }

    return results;
  }

  private async saveEmailMessage(account: any, message: any, organizationId: string): Promise<boolean> {
    const envelope = message.envelope;
    if (!envelope) return false;

    const messageId = envelope.messageId || `${account.id}-${message.uid}`;

    // Check if message already exists
    const existing = await this.prisma.emailMessage.findUnique({
      where: {
        emailAccountId_messageId: {
          emailAccountId: account.id,
          messageId,
        },
      },
    });

    if (existing) return false;

    // Parse email content
    const source = message.source?.toString() || '';
    const textBody = this.extractTextBody(source);
    const htmlBody = this.extractHtmlBody(source);
    const snippet = textBody?.substring(0, 200) || '';

    // Extract addresses
    const fromEmail = envelope.from?.[0]?.address || '';
    const fromName = envelope.from?.[0]?.name || '';
    const toEmails = (envelope.to || []).map((a: any) => a.address).filter(Boolean);
    const ccEmails = (envelope.cc || []).map((a: any) => a.address).filter(Boolean);

    // Determine if sent or received
    const isSent = fromEmail.toLowerCase() === account.email.toLowerCase();

    // Find matching contact by email
    const contactEmail = isSent ? toEmails[0] : fromEmail;
    let contactId: string | null = null;

    if (contactEmail) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          organizationId,
          email: { equals: contactEmail, mode: 'insensitive' },
        },
      });
      contactId = contact?.id || null;
    }

    // Calculate thread ID from In-Reply-To or References
    const threadId = envelope.inReplyTo || envelope.messageId;

    // Save email
    await this.prisma.emailMessage.create({
      data: {
        emailAccountId: account.id,
        messageId,
        uid: message.uid,
        threadId,
        fromEmail,
        fromName,
        toEmails,
        ccEmails,
        bccEmails: [],
        replyTo: envelope.replyTo?.[0]?.address,
        subject: envelope.subject,
        textBody,
        htmlBody,
        snippet,
        isSent,
        isRead: false,
        contactId,
        emailDate: envelope.date || new Date(),
      },
    });

    // Create message in CRM if contact is linked
    if (contactId) {
      const content = envelope.subject
        ? `[Email] ${envelope.subject}\n\n${snippet}`
        : `[Email]\n\n${snippet}`;

      if (isSent) {
        // Find first org member as sender
        const member = await this.prisma.orgMember.findFirst({
          where: { organizationId },
          select: { userId: true },
        });

        if (member) {
          await this.messagesService.sendMessage(
            contactId,
            content,
            'email',
            member.userId,
            organizationId,
            { emailMessageId: messageId, emailAccountId: account.id },
          );
        }
      } else {
        await this.messagesService.receiveMessage(
          contactId,
          content,
          'email',
          organizationId,
          { emailMessageId: messageId, emailAccountId: account.id },
        );
      }
    }

    return true;
  }

  // ============ Email Operations ============

  async getEmails(filter: EmailListFilterDto, organizationId: string): Promise<{
    data: EmailMessageDto[];
    total: number;
    skip: number;
    take: number;
  }> {
    const { skip = 0, take = 50 } = filter;

    const where: any = {
      emailAccount: {
        integration: {
          organizationId,
          type: IntegrationType.EMAIL,
        },
        ...(filter.accountId ? { id: filter.accountId } : {}),
      },
      isDeleted: false,
      ...(filter.contactId ? { contactId: filter.contactId } : {}),
      ...(filter.unreadOnly ? { isRead: false } : {}),
      ...(filter.starredOnly ? { isStarred: true } : {}),
      ...(filter.sentOnly !== undefined ? { isSent: filter.sentOnly } : {}),
      ...(filter.search ? {
        OR: [
          { subject: { contains: filter.search, mode: 'insensitive' } },
          { textBody: { contains: filter.search, mode: 'insensitive' } },
          { fromEmail: { contains: filter.search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [emails, total] = await Promise.all([
      this.prisma.emailMessage.findMany({
        where,
        skip,
        take,
        orderBy: { emailDate: 'desc' },
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true },
          },
          emailAccount: {
            select: { id: true, email: true, displayName: true },
          },
        },
      }),
      this.prisma.emailMessage.count({ where }),
    ]);

    return {
      data: emails.map((e) => this.mapToEmailMessage(e)),
      total,
      skip,
      take,
    };
  }

  async getEmail(messageId: string, organizationId: string): Promise<EmailMessageDto> {
    const email = await this.prisma.emailMessage.findFirst({
      where: {
        id: messageId,
        emailAccount: {
          integration: { organizationId },
        },
      },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
        emailAccount: {
          select: { id: true, email: true, displayName: true },
        },
      },
    });

    if (!email) {
      throw new NotFoundException('Письмо не найдено');
    }

    return this.mapToEmailMessage(email);
  }

  async markEmails(dto: MarkEmailDto, organizationId: string): Promise<void> {
    const updateData: any = {};

    if (dto.isRead !== undefined) updateData.isRead = dto.isRead;
    if (dto.isStarred !== undefined) updateData.isStarred = dto.isStarred;
    if (dto.isArchived !== undefined) updateData.isArchived = dto.isArchived;

    await this.prisma.emailMessage.updateMany({
      where: {
        id: { in: dto.messageIds },
        emailAccount: {
          integration: { organizationId },
        },
      },
      data: updateData,
    });
  }

  async deleteEmails(messageIds: string[], organizationId: string): Promise<void> {
    await this.prisma.emailMessage.updateMany({
      where: {
        id: { in: messageIds },
        emailAccount: {
          integration: { organizationId },
        },
      },
      data: { isDeleted: true },
    });
  }

  async linkEmailToContact(dto: LinkEmailToContactDto, organizationId: string): Promise<void> {
    // Verify contact exists
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    // Update email
    await this.prisma.emailMessage.updateMany({
      where: {
        id: dto.messageId,
        emailAccount: {
          integration: { organizationId },
        },
      },
      data: { contactId: dto.contactId },
    });

    this.logger.log(`Linked email ${dto.messageId} to contact ${dto.contactId}`);
  }

  // ============ Send Email ============

  async sendEmail(dto: SendEmailDto, userId: string, organizationId: string): Promise<{ success: boolean; messageId?: string }> {
    const account = await this.findAccount(dto.accountId, organizationId);
    const credentials = account.integration.credentials as any;

    if (!account.smtpHost) {
      throw new BadRequestException('SMTP не настроен для данного аккаунта');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort || 587,
      secure: account.smtpSecure,
      auth: {
        user: account.email,
        pass: credentials.password,
      },
    });

    // Build message
    const messageId = `<${crypto.randomUUID()}@${account.imapHost}>`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: account.displayName
        ? `${account.displayName} <${account.email}>`
        : account.email,
      to: dto.to.join(', '),
      cc: dto.cc?.join(', '),
      bcc: dto.bcc?.join(', '),
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
      messageId,
      inReplyTo: dto.replyToMessageId,
    };

    try {
      const info = await transporter.sendMail(mailOptions);

      // Save sent email to database
      await this.prisma.emailMessage.create({
        data: {
          emailAccountId: account.id,
          messageId,
          fromEmail: account.email,
          fromName: account.displayName,
          toEmails: dto.to,
          ccEmails: dto.cc || [],
          bccEmails: dto.bcc || [],
          subject: dto.subject,
          textBody: dto.text,
          htmlBody: dto.html,
          isSent: true,
          isRead: true,
          contactId: dto.contactId,
          emailDate: new Date(),
          threadId: dto.replyToMessageId,
        },
      });

      // Update stats
      await this.prisma.emailAccount.update({
        where: { id: account.id },
        data: { emailsSent: { increment: 1 } },
      });

      // Create CRM message if contact linked
      if (dto.contactId) {
        const content = `[Email] ${dto.subject}\n\n${dto.text || ''}`;
        await this.messagesService.sendMessage(
          dto.contactId,
          content,
          'email',
          userId,
          organizationId,
          { emailMessageId: messageId, emailAccountId: account.id },
        );
      }

      this.logger.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to send email: ${error.message}`);
      throw new BadRequestException(`Ошибка отправки: ${error.message}`);
    }
  }

  async replyToEmail(dto: ReplyEmailDto, userId: string, organizationId: string): Promise<{ success: boolean; messageId?: string }> {
    const original = await this.prisma.emailMessage.findFirst({
      where: {
        id: dto.originalMessageId,
        emailAccount: {
          integration: { organizationId },
        },
      },
      include: { emailAccount: true },
    });

    if (!original) {
      throw new NotFoundException('Исходное письмо не найдено');
    }

    // Determine recipients
    const to = dto.replyAll
      ? [original.fromEmail, ...original.toEmails].filter(
          (e) => e.toLowerCase() !== original.emailAccount.email.toLowerCase()
        )
      : [original.fromEmail];

    const cc = dto.replyAll ? original.ccEmails : [];

    return this.sendEmail(
      {
        accountId: original.emailAccountId,
        to,
        cc,
        subject: original.subject?.startsWith('Re:')
          ? original.subject
          : `Re: ${original.subject || ''}`,
        text: dto.text,
        html: dto.html,
        replyToMessageId: original.messageId,
        contactId: original.contactId || undefined,
      },
      userId,
      organizationId,
    );
  }

  // ============ Stats ============

  async getEmailStats(organizationId: string): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    totalEmails: number;
    unreadEmails: number;
    sentEmails: number;
    receivedEmails: number;
  }> {
    const accounts = await this.prisma.emailAccount.findMany({
      where: {
        integration: { organizationId, type: IntegrationType.EMAIL },
      },
      include: { integration: true },
    });

    const accountIds = accounts.map((a) => a.id);

    const [totalEmails, unreadEmails, sentEmails] = await Promise.all([
      this.prisma.emailMessage.count({
        where: { emailAccountId: { in: accountIds }, isDeleted: false },
      }),
      this.prisma.emailMessage.count({
        where: { emailAccountId: { in: accountIds }, isDeleted: false, isRead: false },
      }),
      this.prisma.emailMessage.count({
        where: { emailAccountId: { in: accountIds }, isDeleted: false, isSent: true },
      }),
    ]);

    return {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter((a) => a.integration.isActive).length,
      totalEmails,
      unreadEmails,
      sentEmails,
      receivedEmails: totalEmails - sentEmails,
    };
  }

  // ============ Helper Methods ============

  private async findAccount(accountId: string, organizationId: string) {
    const account = await this.prisma.emailAccount.findFirst({
      where: {
        id: accountId,
        integration: {
          organizationId,
          type: IntegrationType.EMAIL,
        },
      },
      include: { integration: true },
    });

    if (!account) {
      throw new NotFoundException('Почтовый аккаунт не найден');
    }

    return account;
  }

  private extractTextBody(source: string): string | null {
    // Simple extraction - in production use a proper MIME parser
    const textMatch = source.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n\r\n|$)/i);
    return textMatch?.[1]?.trim() || null;
  }

  private extractHtmlBody(source: string): string | null {
    const htmlMatch = source.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n\r\n|$)/i);
    return htmlMatch?.[1]?.trim() || null;
  }

  private mapToAccountInfo(account: any): EmailAccountInfoDto {
    return {
      id: account.id,
      name: account.integration?.name || account.displayName || account.email,
      email: account.email,
      displayName: account.displayName,
      imapHost: account.imapHost,
      imapPort: account.imapPort,
      smtpHost: account.smtpHost,
      smtpPort: account.smtpPort,
      syncEnabled: account.syncEnabled,
      syncFolder: account.syncFolder,
      lastSyncAt: account.lastSyncAt,
      lastSyncError: account.lastSyncError,
      emailsReceived: account.emailsReceived,
      emailsSent: account.emailsSent,
      isActive: account.integration?.isActive ?? true,
      createdAt: account.createdAt,
    };
  }

  private mapToEmailMessage(email: any): EmailMessageDto {
    return {
      id: email.id,
      emailAccountId: email.emailAccountId,
      messageId: email.messageId,
      threadId: email.threadId,
      fromEmail: email.fromEmail,
      fromName: email.fromName,
      toEmails: email.toEmails,
      ccEmails: email.ccEmails,
      subject: email.subject,
      snippet: email.snippet,
      textBody: email.textBody,
      htmlBody: email.htmlBody,
      attachments: email.attachments as any,
      isRead: email.isRead,
      isStarred: email.isStarred,
      isSent: email.isSent,
      contactId: email.contactId,
      contactName: email.contact
        ? `${email.contact.firstName} ${email.contact.lastName}`.trim()
        : undefined,
      emailDate: email.emailDate,
      createdAt: email.createdAt,
    };
  }
}
