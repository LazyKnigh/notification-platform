# Notification Platform System Design

This document describes the design direction for the notification platform pet project. The system should be built incrementally, with a strong focus on production backend concepts and interview-ready explanations.

## Goals

The system should:

- Receive notification requests through an API.
- Store notifications and delivery status in MySQL.
- Process notification delivery asynchronously through Redis/BullMQ and workers.
- Retry temporary failures.
- Avoid duplicate sends in common cases.
- Provide enough logs and health checks for debugging.
- Add GraphQL later as a read/query layer after the REST flow is stable.

## Non-Goals For Early Versions

The early versions do not need:

- Kafka implementation.
- SMS, push notification, or webhook channels.
- Real email provider integration.
- Admin dashboard UI.
- Multi-region deployment.
- Complex permission model.
- Real high availability.

Kafka should be kept as a comparison topic only. The project should first prove the core flow with Redis/BullMQ.

## API Strategy

### REST First

REST is the primary API style for command/write and operational flows:

- `POST /notifications`
- `GET /notifications`
- `GET /notifications/:id`
- `POST /notifications/:id/retry` later if manual retry is needed.

REST is a good fit here because notification commands are explicit, easy to test with Postman, and easy to reason about in logs and operational workflows.

### GraphQL Later

GraphQL should be added after the REST flow works and should focus on read/query use cases:

- Notification detail.
- Notification history.
- Delivery attempts.
- Metrics summary.

GraphQL is useful for practicing schema design, resolver performance, pagination, filtering, and N+1 awareness. It should not be added before the core delivery flow is reliable.

## High-Level Architecture

```text
Client / Internal Service
        |
        v
NestJS API
        |
        +--> MySQL
        |
        +--> Redis Queue
                  |
                  v
            Worker Service
                  |
                  v
        Mock Email Provider

Later:
GraphQL Read API --> MySQL
```

## Main Components

### API Service

Responsibilities:

- Validate requests.
- Create notification records.
- Create delivery records.
- Enqueue delivery jobs.
- Expose REST APIs for commands and basic inspection.
- Expose GraphQL read queries later.

Current repo status:

- NestJS app exists.
- Health and Users modules exist.
- Prisma/MySQL exists.

### MySQL

Responsibilities:

- Store users.
- Store notification requests.
- Store delivery attempts/status.
- Support filtering and pagination.

Important design points:

- Use a transaction when creating notification and delivery records together.
- Add indexes based on real query patterns.
- Keep provider response/error data for debugging.

### Redis/BullMQ

Responsibilities:

- Buffer delivery jobs.
- Let the API return quickly.
- Allow worker concurrency.
- Support retry/backoff.
- Track failed jobs for inspection.

### Worker Service

Responsibilities:

- Consume queue jobs.
- Load notification/delivery data.
- Check current status before sending.
- Mark delivery as processing.
- Call provider.
- Mark delivery as sent or failed.
- Let the queue retry when an error is retryable.

### Provider Layer

Responsibilities:

- Hide provider-specific implementation.
- Normalize success/failure responses.
- Classify retryable vs non-retryable errors.

First implementation:

- Mock email provider.

Delayed implementations:

- Real email provider.
- SMS provider.
- Push provider.
- Webhook provider.

## Core Data Model Draft

```text
User
- id
- email
- createdAt

Notification
- id
- userId
- channel
- subject
- content
- status
- idempotencyKey
- createdAt
- updatedAt

NotificationDelivery
- id
- notificationId
- provider
- status
- attemptCount
- lastError
- providerMessageId
- sentAt
- createdAt
- updatedAt
```

Possible channel values:

- `EMAIL`

Possible status values:

- `PENDING`
- `PROCESSING`
- `SENT`
- `FAILED`
- `CANCELLED`

Future channel values:

- `SMS`
- `PUSH`
- `WEBHOOK`

## Core Flows

### Create Notification Through REST

```text
1. Client calls POST /notifications.
2. API validates the payload.
3. API checks idempotency key if provided.
4. API creates Notification and NotificationDelivery in one MySQL transaction.
5. API adds a job to the Redis queue.
6. API returns notification ID and current status.
```

### Deliver Notification Through Worker

```text
1. Worker receives a queue job.
2. Worker loads the delivery record.
3. Worker checks current delivery status.
4. Worker marks delivery as PROCESSING.
5. Worker calls the mock provider.
6. On success: mark delivery and notification as SENT.
7. On retryable failure: store attempt/error information and let the queue retry.
8. On non-retryable failure or exhausted retries: mark delivery and notification as FAILED.
```

### Query Notification Through GraphQL Later

```text
1. Client sends a GraphQL query for notification history or detail.
2. Resolver validates filter and pagination arguments.
3. Resolver loads notification data from MySQL.
4. Resolver loads delivery attempts when requested.
5. Response returns only the fields requested by the client.
```

## Reliability Concerns

### Retry

Retry should be used for temporary failures:

- Provider timeout.
- Network error.
- 5xx provider response.

Do not retry permanent failures:

- Invalid email.
- Missing required payload.
- Unauthorized provider config.

### Idempotency

The system needs to avoid duplicate sends when:

- The client retries a create request.
- The queue retries a job.
- The worker crashes after the provider call but before the database update.

Early approach:

- Accept `idempotencyKey` from the caller.
- Add a unique constraint where appropriate.
- Worker checks delivery status before sending.

Hard case to understand:

- If the provider succeeds but the worker crashes before updating MySQL, the queue may retry and send again.
- A stronger solution may require provider-level idempotency, provider message IDs, or an outbox-style design.

### Failed Jobs

Failed jobs should be inspectable:

- Notification ID.
- Delivery ID.
- Attempt count.
- Last error message/code.
- Timestamp.

## Failure Scenarios To Study

### Worker Crash

Risk:

- A job may be retried after the worker stops unexpectedly.

Expected behavior:

- The job should return to the queue or be retried.
- The worker should check delivery status before sending again.
- Logs should include job ID, notification ID, and delivery ID.

### Provider Timeout

Risk:

- The provider may receive the request but the worker may not receive the response.

Expected behavior:

- Treat timeout as retryable.
- Record the timeout error.
- Understand that duplicate send is still possible without provider-level idempotency.

### Duplicate Client Request

Risk:

- A client may retry `POST /notifications` because it did not receive a response.

Expected behavior:

- If the same `idempotencyKey` is used, the API should return the existing notification instead of creating a duplicate.

### Queue Retry

Risk:

- Retried jobs can repeat side effects.

Expected behavior:

- Worker should avoid sending if delivery is already `SENT`.
- Retry count and last error should be visible.

## Performance And Scaling

Early version:

- One API instance.
- One worker.
- MySQL.
- Redis.

Scaling path:

- Add more stateless API instances.
- Add more workers.
- Tune worker concurrency.
- Add indexes for list/filter endpoints.
- Batch process when the provider supports it.
- Separate read-heavy GraphQL queries if needed.

Key bottlenecks to watch:

- MySQL writes during high notification volume.
- Queue backlog.
- Provider rate limits.
- Worker concurrency causing DB/provider pressure.
- GraphQL queries causing N+1 database access.

## Observability

Logs should include:

- `requestId`
- `notificationId`
- `deliveryId`
- `jobId`
- `userId`
- `status`
- `attemptCount`
- `errorCode`

Metrics to add later:

- Notifications created count.
- Deliveries sent count.
- Deliveries failed count.
- Retry count.
- Queue waiting/active/failed jobs.
- Provider latency.

Health checks:

- API process.
- MySQL connection.
- Redis connection.
- Worker heartbeat or queue processing status.

## API Draft

REST:

```text
POST /notifications
GET /notifications
GET /notifications/:id
GET /users/:id/notifications
```

GraphQL later:

```graphql
type Query {
  notification(id: ID!): Notification
  notifications(
    filter: NotificationFilter
    pagination: PaginationInput
  ): NotificationConnection!
}
```

Example create payload:

```json
{
  "userId": 1,
  "channel": "EMAIL",
  "subject": "Welcome",
  "content": "Thanks for joining",
  "idempotencyKey": "signup-1-welcome-email"
}
```

## Interview Notes

Important explanations to practice:

- Why the API should enqueue jobs instead of sending notifications directly.
- Why notification and delivery are separate records.
- Why retries need idempotency.
- Why REST is used first and GraphQL is added later for reads.
- How worker concurrency affects database and provider load.
- How to debug a failed notification from logs and database records.
- When Redis/BullMQ is enough and when Kafka might become useful.

## Open Decisions

Decided for now:

- REST first, GraphQL later.
- Mock email provider first.
- Redis/BullMQ before Kafka.
- No admin UI in the early version.
- No complex auth until the core notification flow works.

Still open:

- Should the first auth version use JWT or API keys?
- Should `NotificationTemplate` be introduced before or after queue processing?
- Should the worker live inside the same NestJS app or as a separate app in the monorepo?
- Should pagination start with offset first or cursor immediately?

## Build Order Recommendation

1. Improve README, `.env.example`, and config.
2. Add notification schema + migration.
3. Add Notifications REST API without queue.
4. Add Redis + BullMQ.
5. Add worker with mock provider.
6. Add retry/backoff/status tracking.
7. Add basic observability.
8. Add GraphQL read layer.
9. Add auth/rate limit.
