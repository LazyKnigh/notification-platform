# Daily Log

The goal of this file is to track both project progress and backend learning progress. Each entry should be short, but it should clearly answer what was built, what was learned, what is still unclear, and what should happen next.

Use this as a learning tool, not just a changelog. The most important part is connecting implementation work to production backend concepts and interview explanations.

## Work Rhythm

Business days:
- Pick one small task.
- Keep the scope small enough to finish or clearly continue tomorrow.
- Write a short note about what changed and what was learned.

Weekend:
- Do deeper implementation.
- Review code quality.
- Update system design notes.
- Practice explaining the system in English.

## How To Use

Add a new entry at the top after each working session.

Suggested format:

```md
## YYYY-MM-DD

### Time Spent
- Example: 45 minutes after work / 3 hours on weekend.

### Goal
- Main goal for today.

### Built
- What was coded or changed in the project.

### Verified
- Postman request, automated test, build, manual check, or command used to confirm it works.

### Learned
- Backend concepts or engineering lessons learned today.

### Problems
- Bugs, questions, or topics that are still unclear.

### Decisions
- Technical decisions made and the reason behind them.

### Interview Note
- One short note that could be useful in a backend interview.

### What Can Go Wrong
- Failure case, edge case, or production risk discovered today.

### English Explanation
- 2-5 sentences explaining today's work in English.

### Next Small Action
- The next task small enough for a business-day session.

### Weekend Focus
- Optional: deeper task to handle on the weekend.
```

## Weekly Review Template

Use this once per week:

```md
## Week Review - YYYY-MM-DD

### Shipped
- What working behavior exists now?

### Verified
- What tests, Postman flows, or commands passed?

### Production Lessons
- What did I learn about reliability, data, queues, logs, or scaling?

### Interview Practice
- What can I explain better now?

### Weak Points
- What still feels unclear?

### Next Week
- Main weekday tasks.
- Main weekend focus.
```

## 2026-05-19

### Time Spent
- Documentation session.

### Goal
- Standardize the project documents so the notification platform can be built phase by phase.

### Built
- Updated `ROADMAP.md` into a phased project roadmap.
- Updated `SYSTEM_DESIGN.md` into an initial system design document.
- Created `DAILY_LOG.md` to track project and learning progress.

### Verified
- Reviewed the current repository structure and existing documentation.

### Learned
- How to separate a learning roadmap from a system design document.
- How to describe a backend project through product scope, architecture, data model, reliability, and observability.

### Problems
- The notification domain is not implemented yet. The current project only has the foundation: NestJS, Prisma/MySQL, Health, and Users API.

### Decisions
- Build REST first for command/write flows.
- Add GraphQL later for read/query flows.
- Build API + database before queue/worker.
- Use a mock provider before integrating a real email provider.
- Keep a daily learning log to support weekly review and English explanation practice.

### Interview Note
- A good backend project should show not only CRUD, but also reliability, async processing, failure handling, and observability.

### What Can Go Wrong
- If GraphQL, queue, provider integration, and auth are added too early, the project may become broad but shallow.

### English Explanation
- Today I organized the project documentation.
- The project is a notification platform built with NestJS, Prisma, and MySQL.
- I will start with a simple REST API and database flow before adding a queue and worker.
- GraphQL will be added later as a read layer after the core flow is stable.

### Next Small Action
- Improve README and add `.env.example`.

### Weekend Focus
- Design the Prisma schema for notifications and implement the first REST API flow.
