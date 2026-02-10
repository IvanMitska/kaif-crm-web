import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';

@Injectable()
export class PipelinesService {
  constructor(private prisma: PrismaService) {}

  async create(createPipelineDto: CreatePipelineDto) {
    const { stages, ...pipelineData } = createPipelineDto;

    // Если это первая воронка, делаем её дефолтной
    const pipelinesCount = await this.prisma.pipeline.count();
    const isDefault = pipelinesCount === 0 ? true : createPipelineDto.isDefault;

    // Если новая воронка дефолтная, убираем флаг у других
    if (isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const pipeline = await this.prisma.pipeline.create({
      data: {
        ...pipelineData,
        isDefault,
        stages: stages ? {
          create: stages.map((stage, index) => ({
            name: stage.name,
            color: stage.color || this.getDefaultColor(index),
            order: index,
          })),
        } : {
          create: this.getDefaultStages(),
        },
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { stages: true },
        },
      },
    });

    return pipeline;
  }

  async findAll() {
    const pipelines = await this.prisma.pipeline.findMany({
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { 
            stages: true,
          },
        },
      },
    });

    // Добавляем статистику по каждой воронке
    const pipelinesWithStats = await Promise.all(
      pipelines.map(async (pipeline) => {
        const deals = await this.prisma.deal.findMany({
          where: {
            stage: { pipelineId: pipeline.id },
          },
          select: {
            amount: true,
            status: true,
          },
        });

        const totalDeals = deals.length;
        const wonDeals = deals.filter(d => d.status === 'SUCCESS').length;
        const lostDeals = deals.filter(d => d.status === 'LOST').length;
        const totalAmount = deals.reduce((sum, deal) => sum + Number(deal.amount), 0);
        const wonAmount = deals
          .filter(d => d.status === 'SUCCESS')
          .reduce((sum, deal) => sum + Number(deal.amount), 0);

        return {
          ...pipeline,
          stats: {
            totalDeals,
            wonDeals,
            lostDeals,
            conversionRate: totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0,
            totalAmount,
            wonAmount,
          },
        };
      }),
    );

    return pipelinesWithStats;
  }

  async findOne(id: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { deals: true },
            },
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException('Воронка не найдена');
    }

    // Добавляем статистику по каждому этапу
    const stagesWithStats = await Promise.all(
      pipeline.stages.map(async (stage) => {
        const deals = await this.prisma.deal.findMany({
          where: { stageId: stage.id },
          select: { amount: true },
        });

        const totalAmount = deals.reduce((sum, deal) => sum + Number(deal.amount), 0);

        return {
          ...stage,
          totalAmount,
          dealsCount: stage._count.deals,
        };
      }),
    );

    return {
      ...pipeline,
      stages: stagesWithStats,
    };
  }

  async update(id: string, updatePipelineDto: UpdatePipelineDto) {
    const pipeline = await this.findOne(id);

    // Если делаем воронку дефолтной, убираем флаг у других
    if (updatePipelineDto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { 
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.pipeline.update({
      where: { id },
      data: updatePipelineDto,
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    const pipeline = await this.findOne(id);

    // Проверяем, есть ли сделки в этой воронке
    const dealsCount = await this.prisma.deal.count({
      where: {
        stage: { pipelineId: id },
      },
    });

    if (dealsCount > 0) {
      throw new BadRequestException(
        `Невозможно удалить воронку, в ней есть ${dealsCount} сделок`
      );
    }

    // Проверяем, не последняя ли это воронка
    const pipelinesCount = await this.prisma.pipeline.count();
    if (pipelinesCount === 1) {
      throw new BadRequestException('Невозможно удалить последнюю воронку');
    }

    await this.prisma.pipeline.delete({
      where: { id },
    });

    // Если удалили дефолтную, делаем дефолтной первую оставшуюся
    if (pipeline.isDefault) {
      const firstPipeline = await this.prisma.pipeline.findFirst();
      if (firstPipeline) {
        await this.prisma.pipeline.update({
          where: { id: firstPipeline.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Воронка успешно удалена' };
  }

  async createStage(pipelineId: string, createStageDto: CreateStageDto) {
    const pipeline = await this.findOne(pipelineId);

    // Получаем максимальный order
    const maxOrder = Math.max(...pipeline.stages.map(s => s.order), -1);

    const stage = await this.prisma.stage.create({
      data: {
        ...createStageDto,
        pipelineId,
        order: createStageDto.order ?? maxOrder + 1,
        color: createStageDto.color || this.getDefaultColor(maxOrder + 1),
      },
    });

    // Сдвигаем order у других этапов при необходимости
    if (createStageDto.order !== undefined && createStageDto.order <= maxOrder) {
      await this.prisma.stage.updateMany({
        where: {
          pipelineId,
          order: { gte: createStageDto.order },
          id: { not: stage.id },
        },
        data: {
          order: { increment: 1 },
        },
      });
    }

    return stage;
  }

  async updateStage(stageId: string, updateStageDto: UpdateStageDto) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
      include: { pipeline: true },
    });

    if (!stage) {
      throw new NotFoundException('Этап не найден');
    }

    // Если меняем порядок
    if (updateStageDto.order !== undefined && updateStageDto.order !== stage.order) {
      const stages = await this.prisma.stage.findMany({
        where: { pipelineId: stage.pipelineId },
        orderBy: { order: 'asc' },
      });

      const oldOrder = stage.order;
      const newOrder = updateStageDto.order;

      // Обновляем порядок других этапов
      if (newOrder < oldOrder) {
        await this.prisma.stage.updateMany({
          where: {
            pipelineId: stage.pipelineId,
            order: {
              gte: newOrder,
              lt: oldOrder,
            },
          },
          data: {
            order: { increment: 1 },
          },
        });
      } else {
        await this.prisma.stage.updateMany({
          where: {
            pipelineId: stage.pipelineId,
            order: {
              gt: oldOrder,
              lte: newOrder,
            },
          },
          data: {
            order: { decrement: 1 },
          },
        });
      }
    }

    const updated = await this.prisma.stage.update({
      where: { id: stageId },
      data: updateStageDto,
    });

    return updated;
  }

  async removeStage(stageId: string) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        pipeline: {
          include: {
            stages: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundException('Этап не найден');
    }

    // Проверяем, есть ли сделки на этом этапе
    const dealsCount = await this.prisma.deal.count({
      where: { stageId },
    });

    if (dealsCount > 0) {
      throw new BadRequestException(
        `Невозможно удалить этап, на нем есть ${dealsCount} сделок`
      );
    }

    // Проверяем, не последний ли это этап
    if (stage.pipeline.stages.length === 1) {
      throw new BadRequestException('Невозможно удалить последний этап воронки');
    }

    await this.prisma.stage.delete({
      where: { id: stageId },
    });

    // Обновляем порядок оставшихся этапов
    await this.prisma.stage.updateMany({
      where: {
        pipelineId: stage.pipelineId,
        order: { gt: stage.order },
      },
      data: {
        order: { decrement: 1 },
      },
    });

    return { message: 'Этап успешно удален' };
  }

  async reorderStages(pipelineId: string, stageIds: string[]) {
    const pipeline = await this.findOne(pipelineId);

    // Проверяем, что все ID принадлежат этой воронке
    const existingStageIds = pipeline.stages.map(s => s.id);
    const isValid = stageIds.every(id => existingStageIds.includes(id));

    if (!isValid || stageIds.length !== existingStageIds.length) {
      throw new BadRequestException('Некорректный список этапов');
    }

    // Обновляем порядок
    await Promise.all(
      stageIds.map((id, index) =>
        this.prisma.stage.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return this.findOne(pipelineId);
  }

  private getDefaultStages() {
    return [
      { name: 'Первичный контакт', color: '#3B82F6', order: 0 },
      { name: 'Квалификация', color: '#8B5CF6', order: 1 },
      { name: 'Предложение', color: '#EC4899', order: 2 },
      { name: 'Переговоры', color: '#F59E0B', order: 3 },
      { name: 'Договор', color: '#10B981', order: 4 },
      { name: 'Оплата', color: '#06B6D4', order: 5 },
      { name: 'Успешно', color: '#22C55E', order: 6 },
    ];
  }

  private getDefaultColor(index: number): string {
    const colors = [
      '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
      '#10B981', '#06B6D4', '#22C55E', '#EF4444',
    ];
    return colors[index % colors.length];
  }
}