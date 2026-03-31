import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto, organizationId: string) {
    const tag = await this.prisma.tag.create({
      data: {
        ...createTagDto,
        organizationId,
      },
    });

    return tag;
  }

  async findAll(organizationId: string) {
    const tags = await this.prisma.tag.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tags;
  }

  async findOne(id: string, organizationId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!tag) {
      throw new NotFoundException('Тег не найден');
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto, organizationId: string) {
    await this.findOne(id, organizationId);

    const updated = await this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });

    return updated;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: 'Тег успешно удален' };
  }
}
