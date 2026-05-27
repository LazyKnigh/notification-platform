# Notification Platform Roadmap

This project is a learning-focused backend system. The main goal is to become stronger at production backend engineering and to prepare for backend interviews by building one project deeply instead of many shallow projects.

You already have work experience with Node.js and GraphQL, so this roadmap should not spend too much time on beginner topics. The focus is on system behavior that matters in real services: data modeling, queue processing, reliability, idempotency, observability, Docker, and explaining trade-offs clearly.

## Direction

API strategy:

- REST first for command/write and operational flows.
- GraphQL later for read/query flows.

Why:

- REST is simple and explicit for creating notifications, retrying deliveries, and inspecting operational state.
- GraphQL is useful later for flexible history/detail queries and practicing resolver performance, pagination, and N+1 awareness.
- Building both is useful for interviews, but adding GraphQL too early will make the project broader before the core system is reliable.

Work rhythm:

- Business days: small tasks that can be finished in a short session.
- Weekend: deeper implementation, cleanup, and review.
- Every completed phase should produce working code, verification, notes, and an interview explanation.

## Current Snapshot

Already implemented:

- NestJS API app in `apps/api`.
- Prisma + MySQL.
- Global validation pipe.
- Health module.
- Users module with create/list/detail endpoints.
- Postman collection for Users API.

Not implemented yet:

- Core notification domain.
- Queue/worker.
- Redis.
- GraphQL read layer.
- Auth/rate limit.
- Observability.
- Full Docker setup for API + database + Redis + worker.

## Scope Rules

Build now:

- Notification REST API.
- MySQL persistence.
- Redis/BullMQ queue.
- Worker service.
- Mock email provider.
- Retry/backoff.
- Idempotency.
- Structured logs and health checks.
- GraphQL read layer after the REST flow works.

Delay:

- Kafka implementation.
- SMS/push/webhook channels.
- Admin dashboard UI.
- Complex authentication/authorization.
- Real email provider integration.
- Multi-region/high-availability design.

Kafka should be studied as a comparison topic only: when Redis queue is enough, and when Kafka becomes a better fit.

## 2-3 Month Execution Roadmap

### Week 1 - Foundation Cleanup

Goal: make the repo reliable to run and easy to explain.

Deliverables:

- [x] Improve README with local setup instructions.
- [x] Add `.env.example`.
- [x] Document required services: MySQL now, Redis later.
- [x] Confirm `npm run lint`, `npm run test`, and `npm run build`.
- [x] Decide API base path/versioning convention.
- [x] Define a simple error response convention.

Learning focus:

- Local development workflow.
- Environment configuration.
- Basic API maintainability.

Interview output:

- Explain how the app starts locally.
- Explain why environment variables should be documented.
- Explain how validation and error responses improve API reliability.

### Week 2 - Core Notification REST API

Goal: create the first notification domain without queue processing.

Deliverables:

- [ ] Add Prisma models for `Notification` and `NotificationDelivery`.
- [ ] Add status/channel enums.
- [ ] Implement `POST /notifications`.
- [ ] Implement `GET /notifications`.
- [ ] Implement `GET /notifications/:id`.
- [ ] Add pagination and filters by user, status, channel, and created date.
- [ ] Use a database transaction when creating notification + delivery records.
- [ ] Add Postman requests or tests for the new APIs.

Learning focus:

- REST API design.
- Database relationships.
- Transactions.
- Indexing.
- Pagination and filtering.

Interview output:

- Explain why notification and delivery are separate concepts.
- Explain why creation should use a transaction.
- Explain offset pagination vs cursor pagination.
- Explain what can go wrong if indexes are missing.

### Week 3 - Redis Queue And Worker

Goal: move delivery processing out of the API request path.

Deliverables:

- [ ] Add Redis to Docker Compose.
- [ ] Install and configure BullMQ.
- [ ] Create notification delivery queue.
- [ ] Enqueue a delivery job after notification creation.
- [ ] Add worker process to consume delivery jobs.
- [ ] Add mock email provider.
- [ ] Update delivery status from worker.

Learning focus:

- Async processing.
- Queue architecture.
- Worker lifecycle.
- API responsiveness.

Interview output:

- Explain why sending notification inside the API request is risky.
- Explain the API-to-queue-to-worker flow.
- Explain what happens when workers are slower than incoming traffic.
- Explain at-least-once delivery.

### Week 4 - Reliability: Retry, Backoff, Idempotency

Goal: make the delivery flow handle common failure cases.

Deliverables:

- [ ] Add retry and backoff config for queue jobs.
- [ ] Store attempt count and last error.
- [ ] Add `idempotencyKey` for notification creation.
- [ ] Add status checks before sending to avoid obvious duplicate sends.
- [ ] Define retryable vs non-retryable provider errors.
- [ ] Add failed job inspection notes.

Learning focus:

- Retry strategy.
- Backoff.
- Idempotency.
- Failure classification.
- Duplicate prevention.

Interview output:

- Explain why retries can cause duplicate sends.
- Explain how idempotency keys help client retries.
- Explain the hard case: worker crashes after provider success but before DB update.
- Explain retryable vs non-retryable errors.

### Week 5 - Observability And Operations

Goal: make failures debuggable.

Deliverables:

- [ ] Add structured logging.
- [ ] Add request ID/correlation ID.
- [ ] Include queue job ID in worker logs.
- [ ] Add health checks for API, MySQL, and Redis.
- [ ] Add basic metrics notes: sent, failed, retried, queue backlog.
- [ ] Document operational debugging steps.

Learning focus:

- Production debugging.
- Log context.
- Health checks.
- Metrics thinking.

Interview output:

- Explain which IDs should appear in logs.
- Explain how to debug a failed notification.
- Explain why metrics and logs solve different problems.
- Explain how queue backlog affects system health.

### Week 6 - GraphQL Read Layer

Goal: add GraphQL where it makes sense, after the core REST flow is stable.

Deliverables:

- [ ] Add GraphQL module.
- [ ] Add query for notification detail.
- [ ] Add query for notification history with filters/pagination.
- [ ] Add query for delivery attempts.
- [ ] Review possible N+1 problems.
- [ ] Add DataLoader only if the query shape needs it.

Learning focus:

- GraphQL schema design.
- Resolver design.
- Pagination in GraphQL.
- N+1 awareness.
- REST vs GraphQL trade-offs.

Interview output:

- Explain why REST is used for commands and GraphQL for reads in this project.
- Explain how GraphQL can create N+1 query problems.
- Explain when DataLoader is useful.
- Explain how filtering and pagination differ between REST and GraphQL.

### Week 7 - Docker And Deployment Readiness

Goal: run the full stack consistently.

Deliverables:

- [ ] Add Dockerfile for API.
- [ ] Add worker run command or worker Docker setup.
- [ ] Update Docker Compose for API + worker + MySQL + Redis.
- [ ] Document migration command.
- [ ] Verify production build.
- [ ] Document common local troubleshooting steps.

Learning focus:

- Dockerfile.
- Docker Compose networking.
- Startup order.
- Build-time vs runtime configuration.

Interview output:

- Explain how containers communicate in Docker Compose.
- Explain why migrations should be explicit.
- Explain the difference between local dev and production runtime.

### Week 8 - System Design Review And Interview Polish

Goal: turn the project into interview material.

Deliverables:

- [ ] Update `SYSTEM_DESIGN.md` with the final implemented flow.
- [ ] Add failure scenario notes.
- [ ] Add scaling notes.
- [ ] Add REST vs GraphQL trade-off notes.
- [ ] Add a short English system design explanation.
- [ ] Prepare 10 interview questions from the project.

Learning focus:

- System design communication.
- Trade-off explanation.
- Failure analysis.
- Clear English explanation.

Interview output:

- Explain the whole notification platform in 5 minutes.
- Explain the main trade-offs.
- Explain how the system scales.
- Explain what you would build next and why.

## Phase Completion Criteria

Each phase is only done when all of these are true:

- At least one working API or system flow exists.
- Verification exists through Postman or automated tests.
- A short design note explains the key trade-off.
- An English explanation is written.
- A "what can go wrong?" note is written.

## Weekly Review Checklist

Answer these every week:

- What did I build this week?
- Which part actually runs?
- What did I verify with Postman or tests?
- What production problem did I learn?
- What trade-off can I now explain?
- What failure case did I discover?
- What would I say about this in an interview?
- What is the next small task for business days?
- What is the deeper weekend task?
