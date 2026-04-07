import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ id: string; displayName: string | null; city: string | null; phone: string | null; bio: string | null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
    });

    return {
      id: updated.id,
      displayName: updated.displayName,
      city: updated.city,
      phone: updated.phone,
      bio: updated.bio,
    };
  }
}
