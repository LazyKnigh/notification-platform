# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

```sh
# Dev
npm run api:start:dev       # start API with hot reload

# Verification
npm run lint                # eslint (root config applies to all packages)
npm run test                # jest unit tests (apps/api/src/**/*.spec.ts)
npm run build               # nest build

# Single test file
npm --prefix apps/api run test -- --testPathPattern=users.service

# Test watch mode
npm --prefix apps/api run test:watch

# E2E tests
npm --prefix apps/api run test:e2e

# Database
npm --prefix apps/api exec -- prisma migrate dev     # create + apply migrations
npm --prefix apps/api exec -- prisma generate        # regenerate Prisma client after schema change
npm --prefix apps/api exec -- prisma studio          # browse data
```

## Architecture

Monorepo with a single app today (`apps/api`). A separate worker app is planned but not yet scaffolded.

**`apps/api/src/` layout:**

- `main.ts` — bootstraps NestJS, sets global prefix `api/v1`, global `ValidationPipe` (whitelist + transform)
- `app.module.ts` — root module, imports: `ConfigModule` (global), `DatabaseModule`, `HealthModule`, `UsersModule`
- `database/` — `PrismaService` (extends `PrismaClient`) + `DatabaseModule`; inject `PrismaService` directly in feature services
- `modules/<feature>/` — each feature has controller / service / module + a `dto/` subdirectory

**Planned additions (not yet in code):**

- `NotificationsModule` — REST CRUD for notifications (Week 2)
- BullMQ queue wiring in the API + a worker process (Week 3)
- GraphQL read layer after the REST flow is stable (Week 6)

## Data model

`apps/api/prisma/schema.prisma` — MySQL via Prisma. Current models: `User` only.

Planned models: `Notification` (status/channel enum columns, `idempotencyKey` unique) and `NotificationDelivery` (attempt count, last error, provider message ID). Notification + delivery records must be created in a single transaction.

## Key conventions

- **API base path:** `/api/v1`
- **Error shape:** `{ statusCode, message, error, timestamp, path }` — documented in README, not yet enforced by a global exception filter
- **ValidationPipe flags:** `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — DTOs must use `class-validator` decorators
- **Env vars:** `APP_PORT` (default 3000), `DATABASE_URL`; copy `.env.example` → `apps/api/.env`

## Learning context

This is a learning project focused on production backend concepts (queues, reliability, idempotency, observability). `LEARNING_RULES.md` asks that tradeoffs and architecture be explained before generating full implementations. `SYSTEM_DESIGN.md` and `ROADMAP.md` contain the authoritative design intent and build order — check them before adding new features.
