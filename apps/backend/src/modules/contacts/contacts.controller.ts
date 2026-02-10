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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsFilterDto } from './dto/contacts-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый контакт' })
  @ApiResponse({ status: 201, description: 'Контакт успешно создан' })
  create(
    @Body() createContactDto: CreateContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.create(createContactDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список контактов' })
  @ApiResponse({ status: 200, description: 'Список контактов' })
  findAll(
    @Query() filter: ContactsFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.findAll(filter, user.id, user.role);
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Найти дубликаты контактов' })
  @ApiResponse({ status: 200, description: 'Список дубликатов' })
  findDuplicates(@CurrentUser() user: any) {
    return this.contactsService.findDuplicates(user.id, user.role);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Объединить дубликаты контактов' })
  @ApiResponse({ status: 200, description: 'Контакты объединены' })
  mergeDuplicates(
    @Body('originalId') originalId: string,
    @Body('duplicateId') duplicateId: string,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.mergeDuplicates(
      originalId,
      duplicateId,
      user.id,
      user.role,
    );
  }

  @Post('import')
  @ApiOperation({ summary: 'Импортировать контакты из файла' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Контакты импортированы' })
  @UseInterceptors(FileInterceptor('file'))
  importContacts(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(csv|xlsx|xls)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.importContacts(file, user.id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Экспортировать контакты' })
  @ApiResponse({ status: 200, description: 'Файл с контактами' })
  exportContacts(
    @Query() filter: ContactsFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.exportContacts(filter, user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить контакт по ID' })
  @ApiResponse({ status: 200, description: 'Контакт найден' })
  @ApiResponse({ status: 404, description: 'Контакт не найден' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.findOne(id, user.id, user.role);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Получить статистику по контакту' })
  @ApiResponse({ status: 200, description: 'Статистика контакта' })
  getContactStats(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.getContactStats(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить контакт' })
  @ApiResponse({ status: 200, description: 'Контакт обновлен' })
  @ApiResponse({ status: 404, description: 'Контакт не найден' })
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.update(id, updateContactDto, user.id, user.role);
  }

  @Patch(':id/owner')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Изменить ответственного за контакт' })
  @ApiResponse({ status: 200, description: 'Ответственный изменен' })
  changeOwner(
    @Param('id') id: string,
    @Body('newOwnerId') newOwnerId: string,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.changeOwner(id, newOwnerId, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить контакт' })
  @ApiResponse({ status: 200, description: 'Контакт удален' })
  @ApiResponse({ status: 404, description: 'Контакт не найден' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.remove(id, user.id, user.role);
  }
}