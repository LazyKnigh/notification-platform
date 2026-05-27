import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userId: number;
  let notificationId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'ok',
          service: 'notification-platform-api',
        });
      });
  });

  it('/api/v1/notifications (POST)', async () => {
    const createUserResponse = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        email: `notification-${Date.now()}@example.com`,
      })
      .expect(201);

    userId = createUserResponse.body.id;

    const response = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .send({
        userId,
        channel: 'EMAIL',
        payload: {
          subject: 'Welcome',
          body: 'Thanks for joining the notification platform.',
        },
      })
      .expect(201);

    expect(response.body).toMatchObject({
      userId,
      channel: 'EMAIL',
      status: 'PENDING',
    });
    expect(response.body.deliveries).toHaveLength(1);
    expect(response.body.deliveries[0]).toMatchObject({
      channel: 'EMAIL',
      status: 'PENDING',
      attemptCount: 0,
    });

    notificationId = response.body.id;
  });

  it('/api/v1/notifications (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .query({
        userId,
        channel: 'EMAIL',
        status: 'PENDING',
        page: 1,
        limit: 20,
      })
      .expect(200);

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: notificationId,
          userId,
          channel: 'EMAIL',
          status: 'PENDING',
        }),
      ]),
    );
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 20,
    });
    expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('/api/v1/notifications/:id (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/notifications/${notificationId}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: notificationId,
      userId,
      channel: 'EMAIL',
      status: 'PENDING',
    });
    expect(response.body.deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          notificationId,
          channel: 'EMAIL',
          status: 'PENDING',
        }),
      ]),
    );
  });

  it('/api/v1/notifications rejects invalid channel', () => {
    return request(app.getHttpServer())
      .post('/api/v1/notifications')
      .send({
        userId,
        channel: 'INVALID',
        payload: {
          subject: 'Invalid',
        },
      })
      .expect(400);
  });

  it('/api/v1/notifications rejects missing user', () => {
    return request(app.getHttpServer())
      .post('/api/v1/notifications')
      .send({
        userId: 999999999,
        channel: 'EMAIL',
        payload: {
          subject: 'Missing user',
        },
      })
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
