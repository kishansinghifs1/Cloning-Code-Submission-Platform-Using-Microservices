# Local Setup

This guide gives exact local development commands for each service in this monorepo.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (required for Redis and Evaluator code execution containers)
- A valid `.env` file at repo root (copy from `.env.example`)

## 1. Prepare Environment

From repo root:

```bash
cp .env.example .env
# then edit .env with real values
```

In every terminal where you run a service, load env vars first:

```bash
cd /home/kishan-singh/workspace/ongoing-projects\ :\>/Cloning-Code-Submission-Platform-Using-Microservices
set -a; source .env; set +a
```

## 2. Start Redis

Terminal A:

```bash
docker run --rm --name leetcode_redis -p 6379:6379 redis:alpine
```

## 3. Start Services (One Terminal Per Service)

## User-Service (Port 16000)

Terminal B:

```bash
cd /home/kishan-singh/workspace/ongoing-projects\ :\>/Cloning-Code-Submission-Platform-Using-Microservices
set -a; source .env; set +a
cd User-Service
npm install
PORT=16000 NODE_ENV=development npm run dev
```

## Problem-Service (Port 13000)

Terminal C:

```bash
cd /home/kishan-singh/workspace/ongoing-projects\ :\>/Cloning-Code-Submission-Platform-Using-Microservices
set -a; source .env; set +a
cd Problem-Service
npm install
PORT=13000 NODE_ENV=development npm run dev
```

## Submission-Service (Port 15000)

Terminal D:

```bash
cd /home/kishan-singh/workspace/ongoing-projects\ :\>/Cloning-Code-Submission-Platform-Using-Microservices
set -a; source .env; set +a
cd Submission-Service
npm install
PORT=15000 NODE_ENV=development REDIS_HOST=127.0.0.1 REDIS_PORT=6379 PROBLEM_ADMIN_SERVICE_URL=http://127.0.0.1:13000 npm run dev
```

## Evaluator-Service (Port 14000)

Terminal E:

```bash
cd /home/kishan-singh/workspace/ongoing-projects\ :\>/Cloning-Code-Submission-Platform-Using-Microservices
set -a; source .env; set +a
cd Evaluator-Service
npm install
PORT=14000 REDIS_HOST=127.0.0.1 REDIS_PORT=6379 SUBMISSION_SERVICE_WEBHOOK_BASE_URL=http://127.0.0.1:15000/api/v1/submissions npm run dev
```

Notes:
- Docker Desktop / Docker daemon must be running because Evaluator-Service pulls/runs language containers.
- First evaluator run may take time while pulling images.

## Frontend (Port 5500)

Terminal F:

```bash
cd /home/kishan-singh/workspace/ongoing-projects\ :\>/Cloning-Code-Submission-Platform-Using-Microservices/Frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5500
```

## 4. Optional: Run Backends With Docker Compose Instead

From repo root:

```bash
docker compose up --build
```

Then run only frontend locally:

```bash
cd Frontend
npm install
npm run dev
```

## 5. Quick Health Checks

```bash
curl http://127.0.0.1:16000/ping
curl http://127.0.0.1:13000/ping
curl http://127.0.0.1:15000/api/v1/submissions?userId=test
curl http://127.0.0.1:14000/ping
```
