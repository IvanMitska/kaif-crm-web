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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@ApiTags('tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый тег' })
  @ApiResponse({ status: 201, description: 'Тег успешно создан' })
  create(
    @Body() createTagDto: CreateTagDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tagsService.create(createTagDto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список тегов' })
  @ApiResponse({ status: 200, description: 'Список тегов' })
  findAll(@CurrentOrg() organizationId: string) {
    return this.tagsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тег по ID' })
  @ApiResponse({ status: 200, description: 'Тег найден' })
  @ApiResponse({ status: 404, description: 'Тег не найден' })
  findOne(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tagsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить тег' })
  @ApiResponse({ status: 200, description: 'Тег обновлен' })
  @ApiResponse({ status: 404, description: 'Тег не найден' })
  update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tagsService.update(id, updateTagDto, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить тег' })
  @ApiResponse({ status: 200, description: 'Тег удален' })
  @ApiResponse({ status: 404, description: 'Тег не найден' })
  remove(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tagsService.remove(id, organizationId);
  }
}
