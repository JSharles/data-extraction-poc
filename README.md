# data-extraction-poc

A proof of concept for AI-powered data extraction from documents, structuring output, and interacting with Excel files.

## Table of Contents

- [Why a Monorepo?](#why-a-monorepo)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Initialization](#project-initialization)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)

---

## Why a Monorepo?

This project uses a monorepo structure for the following reasons:

- **Shared types**: TypeScript types are shared between the frontend (`web`) and the core backend (`api`), ensuring a single source of truth for data contracts.
- **Unified tooling**: Linting, formatting, and build configuration are defined once at the root and applied across all packages.
- **Atomic changes**: A feature that spans multiple apps (e.g., a new API endpoint and its corresponding UI) can be committed in a single changeset.
- **Simplified dependency management**: pnpm workspaces hoist shared dependencies and deduplicate them across apps.

---

## Architecture

```
.
├── apps/
│   ├── web/          # Next.js frontend (user-facing)
│   ├── api/          # NestJS core backend (REST API)
│   └── services/     # Python FastAPI service (LLM / AI layer)
├── packages/         # Shared TypeScript packages (types, utilities)
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production environment
├── pnpm-workspace.yaml
└── turbo.json
```

### Service boundaries

| Service    | Role                                                              | Consumed by |
|------------|-------------------------------------------------------------------|-------------|
| `web`      | User interface                                                    | End users   |
| `api`      | Core business logic, orchestration, data persistence             | `web`       |
| `services` | AI/LLM processing (document extraction, formatting, Excel I/O)   | `api`       |

The `services` app is an internal service — it is only called by `api` and is never exposed directly to end users.

---

## Tech Stack

### JavaScript / TypeScript (managed via pnpm workspaces + Turbo)

| Tool | Purpose |
|------|---------|
| [Next.js 16](https://nextjs.org/) | Frontend framework (App Router, Tailwind CSS) |
| [NestJS 11](https://nestjs.com/) | Backend framework (modular, TypeScript-first) |
| [pnpm 11](https://pnpm.io/) | Package manager with workspace support |
| [Turbo](https://turbo.build/) | Monorepo build orchestration and caching |
| [TypeScript](https://www.typescriptlang.org/) | Static typing across all JS/TS apps |

### Python (managed via uv)

| Tool | Purpose |
|------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | Async REST API framework |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server |
| [uv](https://docs.astral.sh/uv/) | Fast Python package and project manager |

### Infrastructure

| Tool | Purpose |
|------|---------|
| [Docker](https://www.docker.com/) | Containerization |
| [Docker Compose](https://docs.docker.com/compose/) | Multi-service orchestration (dev & prod) |

---

## Project Initialization

The following steps document how this project was initialized from scratch, so it can be reproduced if necessary.

### 1. Monorepo scaffold

```bash
mkdir data-extraction-poc && cd data-extraction-poc
git init
mkdir -p apps/web apps/api apps/services packages
```

Created `pnpm-workspace.yaml` at the root:

```yaml
packages:
  - "apps/web"
  - "apps/api"
  - "apps/services/*"
  - "packages/*"
allowBuilds:
  sharp: true
  unrs-resolver: true
```

> `allowBuilds` is required by pnpm 11+ to explicitly authorize packages that run native build scripts during installation.

Created root `package.json` with shared dev dependencies:

```bash
pnpm add -D turbo typescript eslint prettier
```

Created `turbo.json` to define the build pipeline:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "persistent": true, "cache": false },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

> `dependsOn: ["^build"]` ensures that shared `packages/*` are built before the apps that depend on them.

---

### 2. Frontend — Next.js (`apps/web`)

```bash
cd apps/web
pnpm create next-app@latest . --yes
```

> `--yes` accepts all defaults: App Router, Tailwind CSS, TypeScript, ESLint, `src/` directory.

After generation, remove the auto-generated `pnpm-lock.yaml` and `pnpm-workspace.yaml` from `apps/web/` — only the root lockfile should exist in a pnpm monorepo.

Enabled standalone output in `next.config.ts` for Docker production builds:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

---

### 3. Backend — NestJS (`apps/api`)

Initialized manually following the [bare minimum NestJS setup](https://dev.to/micalevisk/5-steps-to-create-a-bare-minimum-nestjs-app-from-scratch-5c3b) to avoid the overhead of the NestJS CLI scaffold.

```bash
cd apps/api
pnpm init
pnpm add reflect-metadata @nestjs/common @nestjs/core @nestjs/platform-express
pnpm add -D typescript @types/node @nestjs/cli @nestjs/schematics
```

Created the following files:

- `tsconfig.json` — TypeScript config with `experimentalDecorators` and `emitDecoratorMetadata` enabled (required by NestJS)
- `tsconfig.build.json` — extends `tsconfig.json`, excludes `node_modules`, `dist`, `test`
- `nest-cli.json` — sets `sourceRoot: "src"` and `entryFile: "main"`
- `src/app.module.ts` — root NestJS module
- `src/main.ts` — application bootstrap on port 3000

---

### 4. AI/LLM Service — FastAPI (`apps/services`)

```bash
cd apps/services
uv init
uv add fastapi uvicorn
```

> `uv init` creates `pyproject.toml`, `uv.lock`, and `.python-version` (pinned to Python 3.13).

Created a minimal `main.py` with a `/health` endpoint as the entry point.

---

### 5. Docker setup

Created multi-stage `Dockerfile` for each app:

- **`dev` stage**: source files mounted as volumes for hot reload
- **`builder` stage**: compiles/builds the application
- **`runner` stage**: minimal production image

| File | Purpose |
|------|---------|
| `apps/web/Dockerfile` | Next.js — standalone output in production |
| `apps/api/Dockerfile` | NestJS — compiled with `nest build` |
| `apps/services/Dockerfile` | FastAPI — uv binary copied from official image |
| `.dockerignore` | Excludes `node_modules`, `.venv`, `dist`, `.next`, etc. |
| `docker-compose.yml` | Dev: named volumes for `node_modules` / `.venv` to preserve container deps |
| `docker-compose.prod.yml` | Prod: production targets, `restart: unless-stopped` |

**Note — pnpm 11 in Docker**: pnpm 11 introduced supply chain policy verification which performs network requests for every package in the lockfile. In a Docker build environment, this can exhaust the network connection before packages are downloaded. The Dockerfiles use `pnpm fetch` followed by `pnpm install --offline` to work around this: `pnpm fetch` downloads all packages to the virtual store in a single pass, then the installation runs entirely offline.

```dockerfile
RUN pnpm fetch
RUN pnpm install --frozen-lockfile --offline
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| pnpm | 11+ | `npm install -g pnpm` |
| Python | 3.13+ | [python.org](https://python.org) |
| uv | latest | `brew install uv` |
| Docker Desktop | latest | [docker.com](https://www.docker.com/products/docker-desktop) |

---

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Development

Starts all services with hot reload:

```bash
docker compose up
```

### Verifying services

| Service | URL | Expected |
|---------|-----|----------|
| Frontend | http://localhost:3000 | Next.js default page |
| Backend (NestJS) | http://localhost:3001 | 404 — no routes defined yet |
| AI Service (FastAPI) | http://localhost:8000/health | `{"status": "ok"}` |

> The NestJS backend returns 404 at root until routes are defined — this is expected behavior.

FastAPI also exposes auto-generated interactive API docs at http://localhost:8000/docs.

### Production

```bash
docker compose -f docker-compose.prod.yml up --build
```
