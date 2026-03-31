import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsFilterDto } from './dto/products-filter.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, organizationId: string) {
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        organizationId,
      },
    });

    return product;
  }

  async findAll(filter: ProductsFilterDto, organizationId: string) {
    const {
      skip = 0,
      take = 20,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = filter;

    const where: Prisma.ProductWhereInput = {
      organizationId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string, organizationId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, organizationId: string) {
    await this.findOne(id, organizationId);

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });

    return updated;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product successfully deleted' };
  }
}
