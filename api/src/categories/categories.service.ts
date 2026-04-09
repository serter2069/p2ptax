import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(data: { name: string; slug?: string; icon?: string; sortOrder?: number }) {
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return this.prisma.serviceCategory.create({
      data: {
        name: data.name,
        slug,
        icon: data.icon,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  update(id: string, data: { name?: string; slug?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    return this.prisma.serviceCategory.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.serviceCategory.delete({ where: { id } });
  }
}
