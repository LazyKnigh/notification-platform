import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateNotificationDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: dto.userId,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return tx.notification.create({
        data: {
          userId: dto.userId,
          channel: dto.channel,
          payload: dto.payload as Prisma.InputJsonValue,
          status: 'PENDING',
          deliveries: {
            create: {
              channel: dto.channel,
              status: 'PENDING',
            },
          },
        },
        include: {
          deliveries: true,
        },
      });
    });
  }

  async findAll(query: ListNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.notification.count({
        where,
      }),
      this.prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },
      include: {
        deliveries: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  private buildWhere(
    query: ListNotificationsDto,
  ): Prisma.NotificationWhereInput {
    return {
      ...(query.userId !== undefined ? { userId: query.userId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.createdFrom || query.createdTo
        ? {
            createdAt: {
              ...(query.createdFrom
                ? { gte: new Date(query.createdFrom) }
                : {}),
              ...(query.createdTo
                ? { lte: new Date(query.createdTo) }
                : {}),
            },
          }
        : {}),
    };
  }
}
