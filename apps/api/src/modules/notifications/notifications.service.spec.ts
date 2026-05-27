import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    $transaction: jest.Mock;
    notification: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let tx: {
    user: {
      findUnique: jest.Mock;
    };
    notification: {
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    tx = {
      user: {
        findUnique: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest.fn((input) => {
        if (typeof input === 'function') {
          return input(tx);
        }

        return Promise.all(input);
      }),
      notification: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new NotificationsService(prisma as never);
  });

  it('creates a notification and delivery in a transaction', async () => {
    tx.user.findUnique.mockResolvedValue({
      id: 1,
    });
    tx.notification.create.mockResolvedValue({
      id: 10,
      userId: 1,
      channel: 'EMAIL',
      status: 'PENDING',
      deliveries: [
        {
          id: 100,
          notificationId: 10,
          channel: 'EMAIL',
          status: 'PENDING',
          attemptCount: 0,
        },
      ],
    });

    const result = await service.create({
      userId: 1,
      channel: 'EMAIL',
      payload: {
        subject: 'Welcome',
      },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 1,
          channel: 'EMAIL',
          status: 'PENDING',
          deliveries: {
            create: {
              channel: 'EMAIL',
              status: 'PENDING',
            },
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      id: 10,
      deliveries: [
        expect.objectContaining({
          status: 'PENDING',
        }),
      ],
    });
  });

  it('rejects creation when user does not exist', async () => {
    tx.user.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        userId: 999,
        channel: 'EMAIL',
        payload: {
          subject: 'Missing user',
        },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns paginated notifications', async () => {
    prisma.notification.count.mockResolvedValue(1);
    prisma.notification.findMany.mockResolvedValue([
      {
        id: 10,
        userId: 1,
        channel: 'EMAIL',
        status: 'PENDING',
      },
    ]);

    const result = await service.findAll({
      userId: 1,
      channel: 'EMAIL',
      status: 'PENDING',
      page: 1,
      limit: 20,
    });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 1,
          channel: 'EMAIL',
          status: 'PENDING',
        },
        skip: 0,
        take: 20,
      }),
    );
    expect(result).toEqual({
      data: [
        {
          id: 10,
          userId: 1,
          channel: 'EMAIL',
          status: 'PENDING',
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('rejects missing notification detail', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
