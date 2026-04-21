import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceFilterDto,
  CreateServiceDto,
  UpdateServiceDto,
  ServiceFilterDto,
  CreateBookingDto,
  UpdateBookingDto,
  BookingFilterDto,
  CancelBookingDto,
  AvailableSlotsDto,
  BookingStatus,
  CreateWaitingListItemDto,
  UpdateWaitingListItemDto,
  WaitingListFilterDto,
  WaitingListStatus,
} from './dto';

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface DaySchedule {
  date: string;
  slots: TimeSlot[];
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private prisma: PrismaService) {}

  // ============ Resources ============

  async createResource(dto: CreateResourceDto, organizationId: string) {
    const { workingHours, breakTime, ...restDto } = dto;

    const resource = await this.prisma.resource.create({
      data: {
        ...restDto,
        workingHours: workingHours as any,
        breakTime: breakTime as any,
        organization: {
          connect: { id: organizationId },
        },
      },
    });

    this.logger.log(`Resource created: ${resource.id}`);
    return resource;
  }

  async findAllResources(filter: ResourceFilterDto, organizationId: string) {
    const { type, category, isActive, search } = filter;

    const where: Prisma.ResourceWhereInput = {
      organizationId,
      ...(type ? { type } : {}),
      ...(category ? { category } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' },
          }
        : {}),
    };

    const resources = await this.prisma.resource.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    return resources;
  }

  async findOneResource(id: string, organizationId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { id, organizationId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        bookings: {
          where: {
            startTime: { gte: new Date() },
          },
          take: 10,
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Ресурс не найден');
    }

    return resource;
  }

  async updateResource(id: string, dto: UpdateResourceDto, organizationId: string) {
    await this.findOneResource(id, organizationId);

    const { workingHours, breakTime, ...restDto } = dto;

    return this.prisma.resource.update({
      where: { id },
      data: {
        ...restDto,
        ...(workingHours !== undefined ? { workingHours: workingHours as any } : {}),
        ...(breakTime !== undefined ? { breakTime: breakTime as any } : {}),
      },
    });
  }

  async deleteResource(id: string, organizationId: string) {
    await this.findOneResource(id, organizationId);

    await this.prisma.resource.delete({
      where: { id },
    });

    return { message: 'Ресурс удалён' };
  }

  // ============ Services ============

  async createService(dto: CreateServiceDto, organizationId: string) {
    const { resourceIds, ...serviceData } = dto;

    const service = await this.prisma.service.create({
      data: {
        ...serviceData,
        organizationId,
        ...(resourceIds && resourceIds.length > 0
          ? {
              resources: {
                create: resourceIds.map((resourceId) => ({
                  resourceId,
                })),
              },
            }
          : {}),
      },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    this.logger.log(`Service created: ${service.id}`);
    return service;
  }

  async findAllServices(filter: ServiceFilterDto, organizationId: string) {
    const { isActive, search, resourceId } = filter;

    const where: Prisma.ServiceWhereInput = {
      organizationId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' },
          }
        : {}),
      ...(resourceId
        ? {
            resources: {
              some: { resourceId },
            },
          }
        : {}),
    };

    const services = await this.prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    return services;
  }

  async findOneService(id: string, organizationId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, organizationId },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Услуга не найдена');
    }

    return service;
  }

  async updateService(id: string, dto: UpdateServiceDto, organizationId: string) {
    await this.findOneService(id, organizationId);

    const { resourceIds, ...serviceData } = dto;

    // If resourceIds provided, update the relations
    if (resourceIds !== undefined) {
      // Delete existing relations
      await this.prisma.resourceService.deleteMany({
        where: { serviceId: id },
      });

      // Create new relations
      if (resourceIds.length > 0) {
        await this.prisma.resourceService.createMany({
          data: resourceIds.map((resourceId) => ({
            serviceId: id,
            resourceId,
          })),
        });
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: serviceData,
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });
  }

  async deleteService(id: string, organizationId: string) {
    await this.findOneService(id, organizationId);

    await this.prisma.service.delete({
      where: { id },
    });

    return { message: 'Услуга удалена' };
  }

  // ============ Bookings ============

  async createBooking(dto: CreateBookingDto, organizationId: string, userId?: string) {
    const { clientName, clientPhone, ...bookingData } = dto;

    // Validate resource exists
    const resource = await this.prisma.resource.findFirst({
      where: { id: bookingData.resourceId, organizationId },
    });

    if (!resource) {
      throw new NotFoundException('Ресурс не найден');
    }

    // Validate service if provided
    if (bookingData.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: bookingData.serviceId, organizationId },
      });

      if (!service) {
        throw new NotFoundException('Услуга не найдена');
      }
    }

    // If contactId not provided but clientName/clientPhone given, create a contact
    let contactId = bookingData.contactId;
    if (!contactId && (clientName || clientPhone)) {
      const [firstName, ...lastNameParts] = (clientName || 'Клиент').split(' ');
      const contact = await this.prisma.contact.create({
        data: {
          firstName,
          lastName: lastNameParts.join(' ') || '',
          phone: clientPhone,
          organizationId,
          ownerId: userId!,
          createdById: userId!,
        },
      });
      contactId = contact.id;
    }

    // Check for overlapping bookings
    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(bookingData.endTime);

    const overlapping = await this.prisma.booking.findFirst({
      where: {
        resourceId: bookingData.resourceId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('На это время уже есть запись');
    }

    const booking = await this.prisma.booking.create({
      data: {
        ...bookingData,
        startTime,
        endTime,
        contactId,
        organizationId,
        createdById: userId,
        color: bookingData.color || resource.color,
      },
      include: {
        resource: true,
        service: true,
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Booking created: ${booking.id} for resource ${resource.name}`);
    return booking;
  }

  async findAllBookings(filter: BookingFilterDto, organizationId: string) {
    const { resourceId, resourceIds, serviceId, contactId, status, dateFrom, dateTo, skip = 0, take = 100 } = filter;

    const resourceIdList = resourceIds ? resourceIds.split(',') : undefined;

    const where: Prisma.BookingWhereInput = {
      organizationId,
      ...(resourceId ? { resourceId } : {}),
      ...(resourceIdList ? { resourceId: { in: resourceIdList } } : {}),
      ...(serviceId ? { serviceId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom || dateTo
        ? {
            startTime: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59.999Z') } : {}),
            },
          }
        : {}),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: 'asc' },
        include: {
          resource: {
            select: {
              id: true,
              name: true,
              color: true,
              avatar: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
            },
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      total,
      skip,
      take,
    };
  }

  async findOneBooking(id: string, organizationId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, organizationId },
      include: {
        resource: true,
        service: true,
        contact: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Запись не найдена');
    }

    return booking;
  }

  async updateBooking(id: string, dto: UpdateBookingDto, organizationId: string) {
    const booking = await this.findOneBooking(id, organizationId);

    // If changing time, check for overlaps
    if (dto.startTime || dto.endTime || dto.resourceId) {
      const startTime = new Date(dto.startTime || booking.startTime);
      const endTime = new Date(dto.endTime || booking.endTime);
      const resourceId = dto.resourceId || booking.resourceId;

      const overlapping = await this.prisma.booking.findFirst({
        where: {
          id: { not: id },
          resourceId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          ],
        },
      });

      if (overlapping) {
        throw new BadRequestException('На это время уже есть запись');
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startTime ? { startTime: new Date(dto.startTime) } : {}),
        ...(dto.endTime ? { endTime: new Date(dto.endTime) } : {}),
      },
      include: {
        resource: true,
        service: true,
        contact: true,
      },
    });
  }

  async confirmBooking(id: string, organizationId: string) {
    await this.findOneBooking(id, organizationId);

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });
  }

  async cancelBooking(id: string, dto: CancelBookingDto, organizationId: string) {
    await this.findOneBooking(id, organizationId);

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      },
    });
  }

  async completeBooking(id: string, organizationId: string) {
    await this.findOneBooking(id, organizationId);

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async markNoShow(id: string, organizationId: string) {
    await this.findOneBooking(id, organizationId);

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
      },
    });
  }

  async deleteBooking(id: string, organizationId: string) {
    await this.findOneBooking(id, organizationId);

    await this.prisma.booking.delete({
      where: { id },
    });

    return { message: 'Запись удалена' };
  }

  // ============ Available Slots ============

  async getAvailableSlots(dto: AvailableSlotsDto, organizationId: string): Promise<TimeSlot[]> {
    const { resourceId, date, serviceId, duration: requestedDuration } = dto;

    // Get resource with working hours
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId, organizationId },
    });

    if (!resource) {
      throw new NotFoundException('Ресурс не найден');
    }

    // Get service duration if serviceId provided
    let slotDuration = requestedDuration || resource.slotDuration;
    if (serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: serviceId, organizationId },
      });
      if (service) {
        slotDuration = service.duration;
      }
    }

    // Get existing bookings for the date
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

    const existingBookings = await this.prisma.booking.findMany({
      where: {
        resourceId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay },
      },
      orderBy: { startTime: 'asc' },
    });

    // Parse working hours
    const workingHours = resource.workingHours as Record<string, { start: string; end: string }> | null;
    const breakTime = resource.breakTime as { start: string; end: string } | null;

    // Get day of week (mon, tue, wed, etc.)
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = dayNames[new Date(date).getDay()];

    // Default working hours if not specified
    const daySchedule = workingHours?.[dayOfWeek] || { start: '09:00', end: '18:00' };

    // Generate all possible slots
    const slots: TimeSlot[] = [];
    const [startHour, startMin] = daySchedule.start.split(':').map(Number);
    const [endHour, endMin] = daySchedule.end.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    while (currentTime + slotDuration <= endTime) {
      const slotStart = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`;
      const slotEnd = `${Math.floor((currentTime + slotDuration) / 60).toString().padStart(2, '0')}:${((currentTime + slotDuration) % 60).toString().padStart(2, '0')}`;

      // Check if slot is during break time
      let isDuringBreak = false;
      if (breakTime) {
        const [breakStartH, breakStartM] = breakTime.start.split(':').map(Number);
        const [breakEndH, breakEndM] = breakTime.end.split(':').map(Number);
        const breakStart = breakStartH * 60 + breakStartM;
        const breakEnd = breakEndH * 60 + breakEndM;

        if (currentTime < breakEnd && currentTime + slotDuration > breakStart) {
          isDuringBreak = true;
        }
      }

      // Check if slot overlaps with existing bookings
      const slotStartDate = new Date(`${date}T${slotStart}:00`);
      const slotEndDate = new Date(`${date}T${slotEnd}:00`);

      const isOverlapping = existingBookings.some((booking) => {
        return booking.startTime < slotEndDate && booking.endTime > slotStartDate;
      });

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !isDuringBreak && !isOverlapping,
      });

      currentTime += slotDuration;
    }

    return slots;
  }

  // ============ Schedule Overview ============

  async getScheduleOverview(
    resourceIds: string[],
    dateFrom: string,
    dateTo: string,
    organizationId: string,
  ) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        organizationId,
        resourceId: { in: resourceIds },
        startTime: { gte: new Date(dateFrom) },
        endTime: { lte: new Date(dateTo + 'T23:59:59.999Z') },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            color: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Group by resource
    const byResource: Record<string, typeof bookings> = {};
    for (const booking of bookings) {
      if (!byResource[booking.resourceId]) {
        byResource[booking.resourceId] = [];
      }
      byResource[booking.resourceId].push(booking);
    }

    return {
      bookings,
      byResource,
      total: bookings.length,
    };
  }

  // ============ Statistics ============

  async getBookingStats(organizationId: string, dateFrom?: string, dateTo?: string) {
    const where: Prisma.BookingWhereInput = {
      organizationId,
      ...(dateFrom || dateTo
        ? {
            startTime: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59.999Z') } : {}),
            },
          }
        : {}),
    };

    const [total, pending, confirmed, completed, cancelled, noShow] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'NO_SHOW' } }),
    ]);

    return {
      total,
      byStatus: {
        pending,
        confirmed,
        completed,
        cancelled,
        noShow,
      },
    };
  }

  // ============ Waiting List ============

  async createWaitingListItem(dto: CreateWaitingListItemDto, organizationId: string, userId?: string) {
    const { clientName, clientPhone, ...itemData } = dto;

    // If no contactId but client info provided, create contact
    let contactId = itemData.contactId;
    if (!contactId && (clientName || clientPhone)) {
      const [firstName, ...lastNameParts] = (clientName || 'Клиент').split(' ');
      const contact = await this.prisma.contact.create({
        data: {
          firstName,
          lastName: lastNameParts.join(' ') || '',
          phone: clientPhone,
          organizationId,
          ownerId: userId!,
          createdById: userId!,
        },
      });
      contactId = contact.id;
    }

    return this.prisma.waitingListItem.create({
      data: {
        ...itemData,
        contactId,
        organizationId,
        preferredDateFrom: itemData.preferredDateFrom ? new Date(itemData.preferredDateFrom) : undefined,
        preferredDateTo: itemData.preferredDateTo ? new Date(itemData.preferredDateTo) : undefined,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        resource: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAllWaitingListItems(filter: WaitingListFilterDto, organizationId: string) {
    const { status, resourceId, serviceId } = filter;

    const where: Prisma.WaitingListItemWhereInput = {
      organizationId,
      ...(status ? { status } : {}),
      ...(resourceId ? { resourceId } : {}),
      ...(serviceId ? { serviceId } : {}),
    };

    return this.prisma.waitingListItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        resource: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateWaitingListItem(id: string, dto: UpdateWaitingListItemDto, organizationId: string) {
    const item = await this.prisma.waitingListItem.findFirst({
      where: { id, organizationId },
    });

    if (!item) {
      throw new NotFoundException('Запись в листе ожидания не найдена');
    }

    return this.prisma.waitingListItem.update({
      where: { id },
      data: {
        ...dto,
        preferredDateFrom: dto.preferredDateFrom ? new Date(dto.preferredDateFrom) : undefined,
        preferredDateTo: dto.preferredDateTo ? new Date(dto.preferredDateTo) : undefined,
        ...(dto.status === 'CONTACTED' ? { contactedAt: new Date() } : {}),
        ...(dto.status === 'BOOKED' ? { bookedAt: new Date() } : {}),
      },
    });
  }

  async deleteWaitingListItem(id: string, organizationId: string) {
    const item = await this.prisma.waitingListItem.findFirst({
      where: { id, organizationId },
    });

    if (!item) {
      throw new NotFoundException('Запись в листе ожидания не найдена');
    }

    await this.prisma.waitingListItem.delete({
      where: { id },
    });

    return { message: 'Запись удалена из листа ожидания' };
  }
}
