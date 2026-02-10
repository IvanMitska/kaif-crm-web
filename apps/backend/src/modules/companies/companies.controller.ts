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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesFilterDto } from './dto/companies-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую компанию' })
  @ApiResponse({ status: 201, description: 'Компания успешно создана' })
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.create(createCompanyDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список компаний' })
  @ApiResponse({ status: 200, description: 'Список компаний' })
  findAll(
    @Query() filter: CompaniesFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.findAll(filter, user.id, user.role);
  }

  @Post('merge')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Объединить компании' })
  @ApiResponse({ status: 200, description: 'Компании объединены' })
  mergeCompanies(
    @Body('originalId') originalId: string,
    @Body('duplicateId') duplicateId: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.mergeCompanies(
      originalId,
      duplicateId,
      user.id,
      user.role,
    );
  }

  @Post('import')
  @ApiOperation({ summary: 'Импортировать компании из файла' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Компании импортированы' })
  @UseInterceptors(FileInterceptor('file'))
  importCompanies(
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
    return this.companiesService.importCompanies(file, user.id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Экспортировать компании' })
  @ApiResponse({ status: 200, description: 'Файл с компаниями' })
  exportCompanies(
    @Query() filter: CompaniesFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.exportCompanies(filter, user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить компанию по ID' })
  @ApiResponse({ status: 200, description: 'Компания найдена' })
  @ApiResponse({ status: 404, description: 'Компания не найдена' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.findOne(id, user.id, user.role);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Получить статистику по компании' })
  @ApiResponse({ status: 200, description: 'Статистика компании' })
  getCompanyStats(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.getCompanyStats(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить компанию' })
  @ApiResponse({ status: 200, description: 'Компания обновлена' })
  @ApiResponse({ status: 404, description: 'Компания не найдена' })
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.update(id, updateCompanyDto, user.id, user.role);
  }

  @Patch(':id/owner')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Изменить ответственного за компанию' })
  @ApiResponse({ status: 200, description: 'Ответственный изменен' })
  changeOwner(
    @Param('id') id: string,
    @Body('newOwnerId') newOwnerId: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.changeOwner(id, newOwnerId, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить компанию' })
  @ApiResponse({ status: 200, description: 'Компания удалена' })
  @ApiResponse({ status: 404, description: 'Компания не найдена' })
  @ApiResponse({ status: 400, description: 'Невозможно удалить компанию с связанными записями' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.companiesService.remove(id, user.id, user.role);
  }
}