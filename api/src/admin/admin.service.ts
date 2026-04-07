import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUpdateSpecialistDto } from './dto/update-specialist.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async updateSpecialist(specialistId: string, dto: AdminUpdateSpecialistDto) {
    const profile = await this.prisma.specialistProfile.findUnique({ where: { userId: specialistId } });
    if (!profile) throw new NotFoundException('Specialist profile not found');
    return this.prisma.specialistProfile.update({
      where: { userId: specialistId },
      data: dto,
    });
  }
}
