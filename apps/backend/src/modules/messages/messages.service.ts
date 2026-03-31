import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, organizationId: string) {
    return this.prisma.message.create({
      data: {
        ...createMessageDto,
        organizationId,
      },
      include: {
        contact: true,
        user: true,
      },
    });
  }

  async findAll(filters: any = {}, organizationId: string) {
    return this.prisma.message.findMany({
      where: {
        ...filters,
        organizationId,
      },
      include: {
        contact: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.message.findFirst({
      where: { id, organizationId },
      include: {
        contact: true,
        user: true,
      },
    });
  }

  async update(id: string, updateMessageDto: UpdateMessageDto, organizationId: string) {
    return this.prisma.message.update({
      where: { id },
      data: updateMessageDto,
      include: {
        contact: true,
        user: true,
      },
    });
  }

  async markAsRead(id: string, organizationId: string) {
    return this.prisma.message.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.message.delete({
      where: { id },
    });
  }
}