import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IntegrationsService } from './integrations.service';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableIntegrations', () => {
    it('should return list of available integrations', async () => {
      const result = await service.getAvailableIntegrations();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include WhatsApp integration', async () => {
      const result = await service.getAvailableIntegrations();
      const whatsapp = result.find(i => i.id === 'whatsapp');

      expect(whatsapp).toBeDefined();
      expect(whatsapp?.name).toBe('WhatsApp Business');
      expect(whatsapp?.icon).toBe('whatsapp');
    });

    it('should include Telegram integration', async () => {
      const result = await service.getAvailableIntegrations();
      const telegram = result.find(i => i.id === 'telegram');

      expect(telegram).toBeDefined();
      expect(telegram?.name).toBe('Telegram');
      expect(telegram?.icon).toBe('telegram');
    });

    it('should include Instagram integration', async () => {
      const result = await service.getAvailableIntegrations();
      const instagram = result.find(i => i.id === 'instagram');

      expect(instagram).toBeDefined();
      expect(instagram?.name).toBe('Instagram');
      expect(instagram?.icon).toBe('instagram');
    });

    it('should include VK integration', async () => {
      const result = await service.getAvailableIntegrations();
      const vk = result.find(i => i.id === 'vk');

      expect(vk).toBeDefined();
      expect(vk?.name).toBe('ВКонтакте');
      expect(vk?.icon).toBe('vk');
    });

    it('should include Email integration as active', async () => {
      const result = await service.getAvailableIntegrations();
      const email = result.find(i => i.id === 'email');

      expect(email).toBeDefined();
      expect(email?.name).toBe('Email');
      expect(email?.status).toBe('active');
    });

    it('should have all required fields for each integration', async () => {
      const result = await service.getAvailableIntegrations();

      result.forEach(integration => {
        expect(integration).toHaveProperty('id');
        expect(integration).toHaveProperty('name');
        expect(integration).toHaveProperty('description');
        expect(integration).toHaveProperty('status');
        expect(integration).toHaveProperty('icon');
      });
    });
  });

  describe('connectIntegration', () => {
    it('should connect WhatsApp integration', async () => {
      const config = { apiKey: 'test-key', phoneNumber: '+1234567890' };
      const result = await service.connectIntegration('whatsapp', config);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should connect Telegram integration', async () => {
      const config = { botToken: 'test-token' };
      const result = await service.connectIntegration('telegram', config);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should connect Instagram integration', async () => {
      const config = { accessToken: 'test-token' };
      const result = await service.connectIntegration('instagram', config);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should connect VK integration', async () => {
      const config = { accessToken: 'test-token', groupId: '12345' };
      const result = await service.connectIntegration('vk', config);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should connect Email integration', async () => {
      const config = { smtpHost: 'smtp.example.com', smtpPort: 587 };
      const result = await service.connectIntegration('email', config);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should throw error for unknown integration', async () => {
      await expect(service.connectIntegration('unknown', {})).rejects.toThrow(
        'Unknown integration: unknown',
      );
    });
  });

  describe('disconnectIntegration', () => {
    it('should disconnect an integration', async () => {
      const result = await service.disconnectIntegration('whatsapp');

      expect(result).toHaveProperty('success', true);
      expect(result.message).toContain('whatsapp');
      expect(result.message).toContain('disconnected');
    });

    it('should handle disconnecting any integration id', async () => {
      const result = await service.disconnectIntegration('telegram');

      expect(result.success).toBe(true);
      expect(result.message).toContain('telegram');
    });
  });

  describe('getIntegrationStatus', () => {
    it('should return integration status', async () => {
      const result = await service.getIntegrationStatus('whatsapp');

      expect(result).toHaveProperty('id', 'whatsapp');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('lastSync');
    });

    it('should return inactive status by default', async () => {
      const result = await service.getIntegrationStatus('telegram');

      expect(result.status).toBe('inactive');
      expect(result.lastSync).toBeNull();
    });

    it('should return id matching the requested integration', async () => {
      const integrationId = 'instagram';
      const result = await service.getIntegrationStatus(integrationId);

      expect(result.id).toBe(integrationId);
    });
  });
});
