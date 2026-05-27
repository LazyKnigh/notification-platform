# Notification Platform

Learning-focused backend project for practicing production backend engineering with NestJS, Prisma, MySQL, queues, reliability, and system design trade-offs.

## Current Stack

- NestJS API in `apps/api`
- Prisma ORM
- MySQL 8 through Docker Compose
- Postman collection for the Users API

Redis, BullMQ, a worker process, and GraphQL are planned for later roadmap phases. Redis is not required for Week 1.

## Prerequisites

- Node.js and npm
- Docker and Docker Compose

## Local Setup

Install dependencies from the repo root:

```sh
npm install
npm --prefix apps/api install
```

Create local environment files:

```sh
cp .env.example apps/api/.env
```

Start MySQL:

```sh
cd apps/api
docker compose up -d mysql
```

Run Prisma migration and generate the Prisma client:

```sh
npm --prefix apps/api exec -- prisma migrate dev
npm --prefix apps/api exec -- prisma generate
```

Start the API from the repo root:

```sh
npm run api:start:dev
```

The API listens on `http://localhost:3000` by default.

## API Convention

REST endpoints use the `/api/v1` base path.

Current endpoints:

- `GET /api/v1/health`
- `POST /api/v1/users`
- `GET /api/v1/users`
- `GET /api/v1/users/:id`

REST is the primary interface for commands and operational flows. GraphQL will be added later for read/query flows after the core notification system is stable.

## Environment Variables

Required now:

- `APP_PORT`: API port, defaults to `3000` when not set.
- `DATABASE_URL`: MySQL connection string used by Prisma.

Planned later:

- Redis connection variables for queue processing.

## Error Response Convention

The target error response shape is:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-05-27T00:00:00.000Z",
  "path": "/api/v1/users"
}
```

Week 1 only documents this convention. Runtime responses currently use NestJS defaults plus the global validation pipe. A global exception filter can be added later when the project needs runtime responses to match this exact shape.

## Verification

Run these checks from the repo root:

```sh
npm run lint
npm run test
npm run build
```

Manual smoke check after starting MySQL and the API:

```sh
curl http://localhost:3000/api/v1/health
```

Expected response includes:

```json
{
  "status": "ok",
  "database": "connected",
  "service": "notification-platform-api"
}
```
