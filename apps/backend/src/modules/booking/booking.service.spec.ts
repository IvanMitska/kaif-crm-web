import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourceType, ResourceCategory, WaitingListStatus } from './dto';

describe('BookingService', () => {
  let service: BookingService;
  let prismaService: PrismaService;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockResourceId = 'resource-123';
  const mockServiceId = 'service-123';
  const mockBookingId = 'booking-123';
  const mockContactId = 'contact-123';

  const mockResource = {
    id: mockResourceId,
    name: 'Анна Иванова',
    type: 'SPECIALIST',
    category: 'SERVICES',
    color: '#3B82F6',
    avatar: 'А',
    description: null,
    workingHours: {
      mon: { start: '09:00', end: '18:00' },
      tue: { start: '09:00', end: '18:00' },
      wed: { start: '09:00', end: '18:00' },
      thu: { start: '09:00', end: '18:00' },
      fri: { start: '09:00', end: '18:00' },
    },
    breakTime: { start: '13:00', end: '14:00' },
    slotDuration: 60,
    isActive: true,
    organizationId: mockOrganizationId,
  };

  const mockServiceEntity = {
    id: mockServiceId,
    name: 'Консультация',
    description: 'Первичная консультация',
    duration: 60,
    price: 1500,
    currency: 'RUB',
    color: '#8B5CF6',
    isActive: true,
    organizationId: mockOrganizationId,
  };

  const mockBooking = {
    id: mockBookingId,
    title: 'Консультация',
    description: null,
    startTime: new Date('2024-01-15T09:00:00.000Z'),
    endTime: new Date('2024-01-15T10:00:00.000Z'),
    status: 'PENDING',
    color: '#3B82F6',
    notes: null,
    metadata: null,
    organizationId: mockOrganizationId,
    resourceId: mockResourceId,
    serviceId: mockServiceId,
    contactId: mockContactId,
    createdById: mockUserId,
    confirmedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    completedAt: null,
    resource: mockResource,
    service: mockServiceEntity,
    contact: {
      id: mockContactId,
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+79001234567',
      email: 'ivan@example.com',
    },
  };

  const mockPrismaService = {
    resource: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    resourceService: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    contact: {
      create: jest.fn(),
    },
    waitingListItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============ Resources Tests ============

  describe('createResource', () => {
    it('should create a resource', async () => {
      const createDto = {
        name: 'Новый ресурс',
        type: ResourceType.SPECIALIST,
        category: ResourceCategory.MEDICAL,
        color: '#10B981',
      };

      mockPrismaService.resource.create.mockResolvedValue({
        id: 'new-resource-id',
        ...createDto,
        organizationId: mockOrganizationId,
      });

      const result = await service.createResource(createDto, mockOrganizationId);

      expect(mockPrismaService.resource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Новый ресурс',
          type: ResourceType.SPECIALIST,
          category: ResourceCategory.MEDICAL,
          color: '#10B981',
          organization: {
            connect: { id: mockOrganizationId },
          },
        }),
      });
      expect(result.name).toBe('Новый ресурс');
    });
  });

  describe('findAllResources', () => {
    it('should return all resources', async () => {
      mockPrismaService.resource.findMany.mockResolvedValue([mockResource]);

      const result = await service.findAllResources({}, mockOrganizationId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Анна Иванова');
    });

    it('should filter by type', async () => {
      mockPrismaService.resource.findMany.mockResolvedValue([mockResource]);

      await service.findAllResources({ type: ResourceType.SPECIALIST }, mockOrganizationId);

      expect(mockPrismaService.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'SPECIALIST' }),
        }),
      );
    });
  });

  describe('findOneResource', () => {
    it('should return a resource', async () => {
      mockPrismaService.resource.findFirst.mockResolvedValue(mockResource);

      const result = await service.findOneResource(mockResourceId, mockOrganizationId);

      expect(result.id).toBe(mockResourceId);
    });

    it('should throw NotFoundException if resource not found', async () => {
      mockPrismaService.resource.findFirst.mockResolvedValue(null);

      await expect(service.findOneResource('invalid', mockOrganizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateResource', () => {
    it('should update a resource', async () => {
      mockPrismaService.resource.findFirst.mockResolvedValue(mockResource);
      mockPrismaService.resource.update.mockResolvedValue({
        ...mockResource,
        name: 'Обновлённый ресурс',
      });

      const result = await service.updateResource(
        mockResourceId,
        { name: 'Обновлённый ресурс' },
        mockOrganizationId,
      );

      expect(result.name).toBe('Обновлённый ресурс');
    });
  });

  describe('deleteResource', () => {
    it('should delete a resource', async () => {
      mockPrismaService.resource.findFirst.mockResolvedValue(mockResource);
      mockPrismaService.resource.delete.mockResolvedValue(mockResource);

      const result = await service.deleteResource(mockResourceId, mockOrganizationId);

      expect(result.message).toContain('удалён');
    });
  });

  // ============ Services Tests ============

  describe('createService', () => {
    it('should create a service', async () => {
      const createDto = {
        name: 'Новая услуга',
        price: 2000,
        duration: 90,
      };

      mockPrismaService.service.create.mockResolvedValue({
        id: 'new-service-id',
        ...createDto,
        organizationId: mockOrganizationId,
      });

      const result = await service.createService(createDto, mockOrganizationId);

      expect(result.name).toBe('Новая услуга');
    });

    it('should create a service with resource links', async () => {
      const createDto = {
        name: 'Услуга с ресурсами',
        price: 1500,
        resourceIds: [mockResourceId],
      };

      mockPrismaService.service.create.mockResolvedValue({
        id: 'new-service-id',
        ...createDto,
        organizationId: mockOrganizationId,
        resources: [{ resourceId: mockResourceId, resource: mockResource }],
      });

      const result = await service.createService(createDto, mockOrganizationId);

      expect(mockPrismaService.service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resources: {
              create: [{ resourceId: mockResourceId }],
            },
          }),
        }),
      );
    });
  });

  describe('findAllServices', () => {
    it('should return all services', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([mockServiceEntity]);

      const result = await service.findAllServices({}, mockOrganizationId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Консультация');
    });
  });

  describe('findOneService', () => {
    it('should return a service', async () => {
      mockPrismaService.service.findFirst.mockResolvedValue(mockServiceEntity);

      const result = await service.findOneService(mockServiceId, mockOrganizationId);

      expect(result.id).toBe(mockServiceId);
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.findFirst.mockResolvedValue(null);

      await expect(service.findOneService('invalid', mockOrganizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ Bookings Tests ============

  describe('createBooking', () => {
    it('should create a booking', async () => {
      const createDto = {
        title: 'Новая запись',
        startTime: '2024-01-15T11:00:00.000Z',
        endTime: '2024-01-15T12:00:00.000Z',
        resourceId: mockResourceId,
        contactId: mockContactId,
      };

      mockPrismaService.resource.findFirst.mockResolvedValue(mockResource);
      mockPrismaService.booking.findFirst.mockResolvedValue(null); // No overlapping
      mockPrismaService.booking.create.mockResolvedValue({
        id: 'new-booking-id',
        ...createDto,
        startTime: new Date(createDto.startTime),
        endTime: new Date(createDto.endTime),
        status: 'PENDING',
        organizationId: mockOrganizationId,
      });

      const result = await service.createBooking(createDto, mockOrganizationId, mockUserId);

      expect(result.title).toBe('Новая запись');
    });

    it('should throw BadRequestException on overlapping booking', async () => {
      const createDto = {
        title: 'Конфликтующая запись',
        startTime: '2024-01-15T09:30:00.000Z',
        endTime: '2024-01-15T10:30:00.000Z',
        resourceId: mockResourceId,
      };

      mockPrismaService.resource.findFirst.mockResolvedValue(mockResource);
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking); // Overlapping exists

      await expect(
        service.createBooking(createDto, mockOrganizationId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if resource not found', async () => {
      const createDto = {
        title: 'Запись',
        startTime: '2024-01-15T11:00:00.000Z',
        endTime: '2024-01-15T12:00:00.000Z',
        resourceId: 'invalid-resource',
      };

      mockPrismaService.resource.findFirst.mockResolvedValue(null);

      await expect(
        service.createBooking(createDto, mockOrganizationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create contact if clientName provided', async () => {
      const createDto = {
        title: 'Запись',
        startTime: '2024-01-15T11:00:00.000Z',
        endTime: '2024-01-15T12:00:00.000Z',
        resourceId: mockResourceId,
        clientName: 'Новый Клиент',
        clientPhone: '+79009876543',
      };

      mockPrismaService.resource.findFirst.mockResolvedValue(mockResource);
      mockPrismaService.contact.create.mockResolvedValue({
        id: 'new-contact-id',
        firstName: 'Новый',
        lastName: 'Клиент',
        phone: '+79009876543',
      });
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.create.mockResolvedValue({
        id: 'new-booking-id',
        ...createDto,
        contactId: 'new-contact-id',
      });

      await service.createBooking(createDto, mockOrganizationId, mockUserId);

      expect(mockPrismaService.contact.create).toHaveBeenCalled();
    });
  });

  describe('findAllBookings', () => {
    it('should return paginated bookings', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([mockBooking]);
      mockPrismaService.booking.count.mockResolvedValue(1);

      const result = await service.findAllBookings({}, mockOrganizationId);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by resourceId', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([mockBooking]);
      mockPrismaService.booking.count.mockResolvedValue(1);

      await service.findAllBookings({ resourceId: mockResourceId }, mockOrganizationId);

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ resourceId: mockResourceId }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.booking.count.mockResolvedValue(0);

      await service.findAllBookings(
        { dateFrom: '2024-01-15', dateTo: '2024-01-15' },
        mockOrganizationId,
      );

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findOneBooking', () => {
    it('should return a booking', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking);

      const result = await service.findOneBooking(mockBookingId, mockOrganizationId);

      expect(result.id).toBe(mockBookingId);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);

      await expect(service.findOneBooking('invalid', mockOrganizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateBooking', () => {
    it('should update a booking', async () => {
      mockPrismaService.booking.findFirst
        .mockResolvedValueOnce(mockBooking) // First call for findOneBooking
        .mockResolvedValueOnce(null); // Second call for overlap check
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        title: 'Обновлённая запись',
      });

      const result = await service.updateBooking(
        mockBookingId,
        { title: 'Обновлённая запись' },
        mockOrganizationId,
      );

      expect(result.title).toBe('Обновлённая запись');
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a booking', async () => {
      // Need to mock findFirst twice - first for findOneBooking validation, then for the actual result
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      });

      await service.confirmBooking(mockBookingId, mockOrganizationId);

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: mockBookingId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: expect.any(Date),
        },
      });
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Клиент отменил',
      });

      const result = await service.cancelBooking(
        mockBookingId,
        { reason: 'Клиент отменил' },
        mockOrganizationId,
      );

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: mockBookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
          cancellationReason: 'Клиент отменил',
        },
      });
    });
  });

  describe('completeBooking', () => {
    it('should complete a booking', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      await service.completeBooking(mockBookingId, mockOrganizationId);

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: mockBookingId },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        },
      });
    });
  });

  describe('markNoShow', () => {
    it('should mark booking as no-show', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'NO_SHOW',
      });

      await service.markNoShow(mockBookingId, mockOrganizationId);

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: mockBookingId },
        data: {
          status: 'NO_SHOW',
        },
      });
    });
  });

  describe('deleteBooking', () => {
    it('should delete a booking', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking);
      mockPrismaService.booking.delete.mockResolvedValue(mockBooking);

      const result = await service.deleteBooking(mockBookingId, mockOrganizationId);

      expect(result.message).toContain('удалена');
    });
  });

  // ============ Available Slots Tests ============

  describe('getAvailableSlots', () => {
    it('should return available slots', async () => {
      mockPrismaService.resource.findFirst.mockResolvedValue(mockResource);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots(
        { resourceId: mockResourceId, date: '2024-01-15' },
        mockOrganizationId,
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('start');
      expect(result[0]).toHaveProperty('end');
      expect(result[0]).toHaveProperty('available');
    });

    it('should mark booked slots as unavailable', async () => {
      // Create a booking that overlaps with 09:00-10:00
      const bookingForToday = {
        ...mockBooking,
        startTime: new Date('2024-01-15T09:00:00'),
        endTime: new Date('2024-01-15T10:00:00'),
      };

      mockPrismaService.resource.findFirst.mockResolvedValue(mockResource);
      mockPrismaService.booking.findMany.mockResolvedValue([bookingForToday]);

      const result = await service.getAvailableSlots(
        { resourceId: mockResourceId, date: '2024-01-15' },
        mockOrganizationId,
      );

      // Find the 09:00 slot and check it's unavailable
      const nineSlot = result.find((s) => s.start === '09:00');
      expect(nineSlot).toBeDefined();
      expect(nineSlot?.available).toBe(false);

      // The 10:00 slot should be available
      const tenSlot = result.find((s) => s.start === '10:00');
      expect(tenSlot?.available).toBe(true);
    });
  });

  // ============ Statistics Tests ============

  describe('getBookingStats', () => {
    it('should return booking statistics', async () => {
      mockPrismaService.booking.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20) // pending
        .mockResolvedValueOnce(30) // confirmed
        .mockResolvedValueOnce(40) // completed
        .mockResolvedValueOnce(5) // cancelled
        .mockResolvedValueOnce(5); // noShow

      const result = await service.getBookingStats(mockOrganizationId);

      expect(result.total).toBe(100);
      expect(result.byStatus.pending).toBe(20);
      expect(result.byStatus.confirmed).toBe(30);
      expect(result.byStatus.completed).toBe(40);
      expect(result.byStatus.cancelled).toBe(5);
      expect(result.byStatus.noShow).toBe(5);
    });
  });

  // ============ Waiting List Tests ============

  describe('createWaitingListItem', () => {
    it('should create a waiting list item', async () => {
      const createDto = {
        contactId: mockContactId,
        resourceId: mockResourceId,
        notes: 'Хочу записаться на понедельник',
      };

      mockPrismaService.waitingListItem.create.mockResolvedValue({
        id: 'waiting-123',
        ...createDto,
        status: 'WAITING',
        organizationId: mockOrganizationId,
      });

      const result = await service.createWaitingListItem(createDto, mockOrganizationId);

      expect(result.notes).toBe('Хочу записаться на понедельник');
    });
  });

  describe('findAllWaitingListItems', () => {
    it('should return waiting list items', async () => {
      mockPrismaService.waitingListItem.findMany.mockResolvedValue([
        {
          id: 'waiting-123',
          contactId: mockContactId,
          status: 'WAITING',
        },
      ]);

      const result = await service.findAllWaitingListItems({}, mockOrganizationId);

      expect(result).toHaveLength(1);
    });
  });

  describe('updateWaitingListItem', () => {
    it('should update waiting list item status', async () => {
      mockPrismaService.waitingListItem.findFirst.mockResolvedValue({
        id: 'waiting-123',
        status: 'WAITING',
      });
      mockPrismaService.waitingListItem.update.mockResolvedValue({
        id: 'waiting-123',
        status: 'CONTACTED',
        contactedAt: new Date(),
      });

      const result = await service.updateWaitingListItem(
        'waiting-123',
        { status: WaitingListStatus.CONTACTED },
        mockOrganizationId,
      );

      expect(mockPrismaService.waitingListItem.update).toHaveBeenCalledWith({
        where: { id: 'waiting-123' },
        data: expect.objectContaining({
          status: 'CONTACTED',
          contactedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('deleteWaitingListItem', () => {
    it('should delete waiting list item', async () => {
      mockPrismaService.waitingListItem.findFirst.mockResolvedValue({
        id: 'waiting-123',
      });
      mockPrismaService.waitingListItem.delete.mockResolvedValue({});

      const result = await service.deleteWaitingListItem('waiting-123', mockOrganizationId);

      expect(result.message).toContain('удалена');
    });

    it('should throw NotFoundException if item not found', async () => {
      mockPrismaService.waitingListItem.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteWaitingListItem('invalid', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
