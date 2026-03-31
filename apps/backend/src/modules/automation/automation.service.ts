import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

@Injectable()
export class AutomationService {
  constructor(private prisma: PrismaService) {}

  async create(createAutomationDto: CreateAutomationDto, organizationId: string) {
    return this.prisma.automation.create({
      data: {
        ...createAutomationDto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.automation.findMany({
      where: { organizationId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.automation.findFirst({
      where: { id, organizationId },
    });
  }

  async update(id: string, updateAutomationDto: UpdateAutomationDto, organizationId: string) {
    return this.prisma.automation.update({
      where: { id },
      data: updateAutomationDto,
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.automation.delete({
      where: { id },
    });
  }

  async execute(id: string, organizationId: string) {
    const automation = await this.findOne(id, organizationId);
    if (!automation || !automation.isActive) {
      throw new Error('Automation not found or inactive');
    }

    // Здесь будет логика выполнения автоматизации
    await this.prisma.automation.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Automation executed successfully',
    };
  }

  async getActiveAutomations(organizationId: string) {
    return this.prisma.automation.findMany({
      where: {
        isActive: true,
        organizationId,
      },
    });
  }
}