import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BookingService } from './booking.service';
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
  CreateWaitingListItemDto,
  UpdateWaitingListItemDto,
  WaitingListFilterDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@ApiTags('Booking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ============ Resources ============

  @Post('resources')
  @ApiOperation({ summary: 'Создать ресурс' })
  @ApiResponse({ status: 201, description: 'Ресурс создан' })
  createResource(
    @Body() dto: CreateResourceDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.createResource(dto, organizationId);
  }

  @Get('resources')
  @ApiOperation({ summary: 'Получить все ресурсы' })
  @ApiResponse({ status: 200, description: 'Список ресурсов' })
  findAllResources(
    @Query() filter: ResourceFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.findAllResources(filter, organizationId);
  }

  @Get('resources/:id')
  @ApiOperation({ summary: 'Получить ресурс по ID' })
  @ApiResponse({ status: 200, description: 'Ресурс' })
  @ApiResponse({ status: 404, description: 'Ресурс не найден' })
  findOneResource(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.findOneResource(id, organizationId);
  }

  @Patch('resources/:id')
  @ApiOperation({ summary: 'Обновить ресурс' })
  @ApiResponse({ status: 200, description: 'Ресурс обновлён' })
  updateResource(
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.updateResource(id, dto, organizationId);
  }

  @Delete('resources/:id')
  @ApiOperation({ summary: 'Удалить ресурс' })
  @ApiResponse({ status: 200, description: 'Ресурс удалён' })
  deleteResource(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.deleteResource(id, organizationId);
  }

  // ============ Services ============

  @Post('services')
  @ApiOperation({ summary: 'Создать услугу' })
  @ApiResponse({ status: 201, description: 'Услуга создана' })
  createService(
    @Body() dto: CreateServiceDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.createService(dto, organizationId);
  }

  @Get('services')
  @ApiOperation({ summary: 'Получить все услуги' })
  @ApiResponse({ status: 200, description: 'Список услуг' })
  findAllServices(
    @Query() filter: ServiceFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.findAllServices(filter, organizationId);
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Получить услугу по ID' })
  @ApiResponse({ status: 200, description: 'Услуга' })
  @ApiResponse({ status: 404, description: 'Услуга не найдена' })
  findOneService(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.findOneService(id, organizationId);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Обновить услугу' })
  @ApiResponse({ status: 200, description: 'Услуга обновлена' })
  updateService(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.updateService(id, dto, organizationId);
  }

  @Delete('services/:id')
  @ApiOperation({ summary: 'Удалить услугу' })
  @ApiResponse({ status: 200, description: 'Услуга удалена' })
  deleteService(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.deleteService(id, organizationId);
  }

  // ============ Bookings ============

  @Post()
  @ApiOperation({ summary: 'Создать запись' })
  @ApiResponse({ status: 201, description: 'Запись создана' })
  createBooking(
    @Body() dto: CreateBookingDto,
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingService.createBooking(dto, organizationId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все записи' })
  @ApiResponse({ status: 200, description: 'Список записей' })
  findAllBookings(
    @Query() filter: BookingFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.findAllBookings(filter, organizationId);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Получить доступные слоты' })
  @ApiResponse({ status: 200, description: 'Список доступных слотов' })
  getAvailableSlots(
    @Query() dto: AvailableSlotsDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.getAvailableSlots(dto, organizationId);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Получить расписание' })
  @ApiResponse({ status: 200, description: 'Расписание ресурсов' })
  getScheduleOverview(
    @Query('resourceIds') resourceIds: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @CurrentOrg() organizationId: string,
  ) {
    const ids = resourceIds ? resourceIds.split(',') : [];
    return this.bookingService.getScheduleOverview(ids, dateFrom, dateTo, organizationId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику записей' })
  @ApiResponse({ status: 200, description: 'Статистика записей' })
  getBookingStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.getBookingStats(organizationId, dateFrom, dateTo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить запись по ID' })
  @ApiResponse({ status: 200, description: 'Запись' })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  findOneBooking(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.findOneBooking(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить запись' })
  @ApiResponse({ status: 200, description: 'Запись обновлена' })
  updateBooking(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.updateBooking(id, dto, organizationId);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Подтвердить запись' })
  @ApiResponse({ status: 200, description: 'Запись подтверждена' })
  confirmBooking(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.confirmBooking(id, organizationId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Отменить запись' })
  @ApiResponse({ status: 200, description: 'Запись отменена' })
  cancelBooking(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.cancelBooking(id, dto, organizationId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Завершить запись' })
  @ApiResponse({ status: 200, description: 'Запись завершена' })
  completeBooking(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.completeBooking(id, organizationId);
  }

  @Patch(':id/no-show')
  @ApiOperation({ summary: 'Отметить неявку' })
  @ApiResponse({ status: 200, description: 'Неявка отмечена' })
  markNoShow(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.markNoShow(id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить запись' })
  @ApiResponse({ status: 200, description: 'Запись удалена' })
  deleteBooking(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.deleteBooking(id, organizationId);
  }

  // ============ Waiting List ============

  @Post('waiting-list')
  @ApiOperation({ summary: 'Добавить в лист ожидания' })
  @ApiResponse({ status: 201, description: 'Добавлено в лист ожидания' })
  createWaitingListItem(
    @Body() dto: CreateWaitingListItemDto,
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingService.createWaitingListItem(dto, organizationId, userId);
  }

  @Get('waiting-list')
  @ApiOperation({ summary: 'Получить лист ожидания' })
  @ApiResponse({ status: 200, description: 'Лист ожидания' })
  findAllWaitingListItems(
    @Query() filter: WaitingListFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.findAllWaitingListItems(filter, organizationId);
  }

  @Patch('waiting-list/:id')
  @ApiOperation({ summary: 'Обновить запись в листе ожидания' })
  @ApiResponse({ status: 200, description: 'Запись обновлена' })
  updateWaitingListItem(
    @Param('id') id: string,
    @Body() dto: UpdateWaitingListItemDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.updateWaitingListItem(id, dto, organizationId);
  }

  @Delete('waiting-list/:id')
  @ApiOperation({ summary: 'Удалить из листа ожидания' })
  @ApiResponse({ status: 200, description: 'Удалено из листа ожидания' })
  deleteWaitingListItem(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.bookingService.deleteWaitingListItem(id, organizationId);
  }
}
