# Cloning Code Submission Platform Using Microservices

A microservices-based coding platform inspired by LeetCode-style workflows.

## What This Project Does

- User registration and authentication (JWT)
- Coding problem management
- Code submission and asynchronous evaluation
- Test-case-based result reporting
- Frontend for solving problems and viewing submissions

## System Architecture

The platform is split into independent services:

- `User-Service` (Express + MongoDB): auth, profile, token refresh
- `Problem-Service` (Express + MongoDB): problem CRUD, markdown sanitization
- `Submission-Service` (Fastify + MongoDB + Redis): submission orchestration, queue producer, evaluation callback receiver
- `Evaluator-Service` (TypeScript + BullMQ + Dockerode): queue consumer, isolated code execution in containers
- `Frontend` (HTML/CSS/JS + Node proxy): UI for users
- `Redis`: queue broker for evaluation jobs

## Request Flow (Submission)

1. Frontend submits code to `Submission-Service`.
2. `Submission-Service` fetches problem metadata from `Problem-Service`.
3. Submission is persisted and queued in Redis (`SubmissionQueue`).
4. `Evaluator-Service` consumes the job, runs code against test cases in Docker containers.
5. `Evaluator-Service` posts evaluation results back to `Submission-Service`.
6. Frontend fetches latest submission status/results.

## Repository Layout

```text
.
├── User-Service/
├── Problem-Service/
├── Submission-Service/
├── Evaluator-Service/
├── Frontend/
├── docker-compose.yml
├── README.md
└── docs/
    ├── README.md
    ├── LOCAL_SETUP.md
    └── ARCHITECTURE_DOCUMENTATION.md
```

## Quick Start

### Option A: Docker Compose (Recommended for backends)

```bash
docker compose up --build
```

Run frontend separately:

```bash
cd Frontend
npm install
npm run dev
```

Open: `http://localhost:5500`

### Option B: Full Local Dev (all services)

Use the exact per-service commands in:

- [LOCAL_SETUP.md](./LOCAL_SETUP.md)

## Service Ports

- Frontend: `5500`
- User-Service: `16000` (local/dev target used by frontend proxy)
- Problem-Service: `13000`
- Submission-Service: `15000`
- Evaluator-Service: `14000`
- Redis: `6379`

## Key Endpoints

### User-Service
- `POST /api/v1/users/register`
- `POST /api/v1/users/login`
- `GET /api/v1/users/profile`

### Problem-Service
- `GET /api/v1/problems`
- `GET /api/v1/problems/:id`
- `POST /api/v1/problems`

### Submission-Service
- `POST /api/v1/submissions`
- `GET /api/v1/submissions?userId=<id>`
- `GET /api/v1/submissions/:submissionId`
- `POST /api/v1/submissions/:submissionId/evaluate-result`

## Configuration

Create `.env` at repo root using `.env.example` and fill:

- `ATLAS_DB_URL`
- `LOG_DB_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

## Documentation

- Deep architecture reference: [ARCHITECTURE_DOCUMENTATION.md](./ARCHITECTURE_DOCUMENTATION.md)
- Local development commands: [LOCAL_SETUP.md](./LOCAL_SETUP.md)

## Current Known Gaps

- Problem listing API currently does not fully support frontend query expectations (`page`, `limit`, `search`, `difficulty`).
- Submission listing currently ignores frontend `status` filter.
- Legacy evaluation worker file exists in submission service but is not part of active queue flow.
- Webhook retry service exists but is not started during app bootstrap.

## Contributing Notes

- Keep service boundaries clear (controllers/services/repositories/models).
- Keep queue contract (`SubmissionQueue` + `SubmissionJob`) stable across Submission and Evaluator services.
- Be careful with secrets: never commit real credentials in `.env`.
