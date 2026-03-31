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
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую компанию' })
  @ApiResponse({ status: 201, description: 'Компания успешно создана' })
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.create(createCompanyDto, user.id, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список компаний' })
  @ApiResponse({ status: 200, description: 'Список компаний' })
  findAll(
    @Query() filter: CompaniesFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.findAll(filter, organizationId);
  }

  @Post('merge')
  @OrgRoles(OrgRole.ADMIN)
  @ApiOperation({ summary: 'Объединить компании' })
  @ApiResponse({ status: 200, description: 'Компании объединены' })
  mergeCompanies(
    @Body('originalId') originalId: string,
    @Body('duplicateId') duplicateId: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.mergeCompanies(
      originalId,
      duplicateId,
      user.id,
      organizationId,
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
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.importCompanies(file, user.id, organizationId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Экспортировать компании' })
  @ApiResponse({ status: 200, description: 'Файл с компаниями' })
  exportCompanies(
    @Query() filter: CompaniesFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.exportCompanies(filter, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить компанию по ID' })
  @ApiResponse({ status: 200, description: 'Компания найдена' })
  @ApiResponse({ status: 404, description: 'Компания не найдена' })
  findOne(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.findOne(id, organizationId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Получить статистику по компании' })
  @ApiResponse({ status: 200, description: 'Статистика компании' })
  getCompanyStats(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.getCompanyStats(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить компанию' })
  @ApiResponse({ status: 200, description: 'Компания обновлена' })
  @ApiResponse({ status: 404, description: 'Компания не найдена' })
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.update(id, updateCompanyDto, user.id, organizationId);
  }

  @Patch(':id/owner')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @ApiOperation({ summary: 'Изменить ответственного за компанию' })
  @ApiResponse({ status: 200, description: 'Ответственный изменен' })
  changeOwner(
    @Param('id') id: string,
    @Body('newOwnerId') newOwnerId: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.changeOwner(id, newOwnerId, user.id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить компанию' })
  @ApiResponse({ status: 200, description: 'Компания удалена' })
  @ApiResponse({ status: 404, description: 'Компания не найдена' })
  @ApiResponse({ status: 400, description: 'Невозможно удалить компанию с связанными записями' })
  remove(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.companiesService.remove(id, organizationId);
  }
}