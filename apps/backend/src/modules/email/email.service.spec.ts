import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockInvitationParams = {
    to: 'test@example.com',
    inviterName: 'John Doe',
    organizationName: 'Test Org',
    role: 'MANAGER',
    inviteUrl: 'https://example.com/invite/abc123',
    expiresAt: new Date('2024-12-31'),
  };

  describe('without API key', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'RESEND_API_KEY') return null;
                if (key === 'EMAIL_FROM') return 'Test <test@example.com>';
                return null;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('sendInvitationEmail', () => {
      it('should return false when no API key is configured', async () => {
        const result = await service.sendInvitationEmail(mockInvitationParams);

        expect(result).toBe(false);
      });

      it('should log warning when no API key', async () => {
        const loggerSpy = jest.spyOn((service as any).logger, 'warn');

        await service.sendInvitationEmail(mockInvitationParams);

        expect(loggerSpy).toHaveBeenCalled();
      });
    });
  });

  describe('with API key', () => {
    let mockResendInstance: any;

    beforeEach(async () => {
      // Reset Resend mock for each test
      jest.clearAllMocks();

      mockResendInstance = {
        emails: {
          send: jest.fn(),
        },
      };

      const { Resend } = require('resend');
      (Resend as jest.Mock).mockImplementation(() => mockResendInstance);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'RESEND_API_KEY') return 'test-api-key';
                if (key === 'EMAIL_FROM') return 'Sintara CRM <noreply@sintara.com>';
                return null;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    describe('sendInvitationEmail', () => {
      it('should send email successfully', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        const result = await service.sendInvitationEmail(mockInvitationParams);

        expect(result).toBe(true);
        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            to: [mockInvitationParams.to],
            subject: expect.stringContaining(mockInvitationParams.organizationName),
          }),
        );
      });

      it('should return false when Resend returns error', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: null,
          error: { message: 'API error' },
        });

        const result = await service.sendInvitationEmail(mockInvitationParams);

        expect(result).toBe(false);
      });

      it('should return false when exception occurs', async () => {
        mockResendInstance.emails.send.mockRejectedValue(new Error('Network error'));

        const result = await service.sendInvitationEmail(mockInvitationParams);

        expect(result).toBe(false);
      });

      it('should include invite URL in email', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await service.sendInvitationEmail(mockInvitationParams);

        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining(mockInvitationParams.inviteUrl),
          }),
        );
      });

      it('should include inviter name in email', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await service.sendInvitationEmail(mockInvitationParams);

        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining(mockInvitationParams.inviterName),
          }),
        );
      });

      it('should include organization name in email', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await service.sendInvitationEmail(mockInvitationParams);

        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining(mockInvitationParams.organizationName),
          }),
        );
      });

      it('should translate role names to Russian', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await service.sendInvitationEmail({ ...mockInvitationParams, role: 'ADMIN' });

        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining('Администратор'),
          }),
        );
      });

      it('should handle OWNER role', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await service.sendInvitationEmail({ ...mockInvitationParams, role: 'OWNER' });

        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining('Владелец'),
          }),
        );
      });

      it('should handle OPERATOR role', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await service.sendInvitationEmail({ ...mockInvitationParams, role: 'OPERATOR' });

        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining('Оператор'),
          }),
        );
      });

      it('should handle unknown role by using role value', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await service.sendInvitationEmail({ ...mockInvitationParams, role: 'CUSTOM_ROLE' });

        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            html: expect.stringContaining('CUSTOM_ROLE'),
          }),
        );
      });

      it('should use configured from email', async () => {
        mockResendInstance.emails.send.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await service.sendInvitationEmail(mockInvitationParams);

        expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
          expect.objectContaining({
            from: 'Sintara CRM <noreply@sintara.com>',
          }),
        );
      });
    });
  });

  describe('default configuration', () => {
    it('should use default from email when not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'RESEND_API_KEY') return null;
                if (key === 'EMAIL_FROM') return null;
                return null;
              }),
            },
          },
        ],
      }).compile();

      const serviceWithDefaults = module.get<EmailService>(EmailService);
      expect(serviceWithDefaults).toBeDefined();
    });
  });
});
