# Autonomous Sales Platform

AI-powered autonomous sales department. Founder enters a website URL — AI agents analyze, generate campaigns, and execute multi-channel outreach.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| API | NestJS (TypeScript) |
| Worker | NestJS + BullMQ |
| Frontend | Next.js 15 App Router + shadcn/ui + Tailwind |
| Database | PostgreSQL + Drizzle ORM |
| Queue | BullMQ + Redis |
| LLM | Groq (Qwen3-32B + Llama 4 Scout) / Ollama (local) |
| Deploy | Railway (3 services) |

---

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- PostgreSQL (local or Railway)
- Redis (local or Railway)
- Groq API key (free at console.groq.com)

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd autonomous-sales
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
# Fill in DATABASE_URL, REDIS_URL, GROQ_API_KEY, NEXTAUTH_SECRET
```

### 3. Database setup

```bash
# Generate Drizzle migration files
pnpm db:generate

# Run migrations (creates all 32 tables)
pnpm db:migrate
```

### 4. Start development

```bash
# All services in parallel
pnpm dev

# Or individually
pnpm dev:api     # NestJS API    → http://localhost:3001
pnpm dev:worker  # BullMQ worker → http://localhost:3002/health
pnpm dev:web     # Next.js       → http://localhost:3000
```

---

## Project Structure

```
autonomous-sales/
├── apps/
│   ├── api/          NestJS REST API (9 modules)
│   ├── worker/       BullMQ job processors (7 queues)
│   └── web/          Next.js 15 frontend
├── packages/
│   ├── database/     Drizzle ORM schemas (32 tables)
│   └── shared/       Types, LLM abstraction, queue names
├── .env.example
├── turbo.json
└── pnpm-workspace.yaml
```

---

## API Documentation

Swagger UI available in development:

```
http://localhost:3001/api/docs
```

---

## Database

```bash
pnpm db:generate    # Generate migration from schema changes
pnpm db:migrate     # Apply migrations
pnpm db:studio      # Open Drizzle Studio (visual DB browser)
```

### Key tables

| Table | Purpose |
|---|---|
| `users` + `workspaces` | Multi-tenant auth |
| `projects` + `project_analysis` | One product per project |
| `icp_profiles` | Ideal Customer Profiles per project |
| `leads` + `phone_verification` | Lead database with TCPA classification |
| `campaigns` + `email_sequences` | Campaign structure |
| `outreach_events` | Every email/call logged here |
| `agent_executions` | Full audit trail of all AI runs |
| `compliance_rules` | Country/state rules (CAN-SPAM, TCPA, GDPR) |
| `call_consent_records` | TCPA prior written consent records |
| `strategy_learned_rules` | Per-project AI learning |
| `platform_learned_rules` | Cross-project collective intelligence |

---

## LLM Configuration

```bash
# .env
LLM_PROVIDER=groq      # or: ollama

# Groq (cloud, recommended)
GROQ_API_KEY=gsk_...

# Ollama (local fallback — run `ollama pull qwen2.5:32b` first)
OLLAMA_BASE_URL=http://localhost:11434
```

Agent model mapping:

| Agent | Groq model | Ollama model |
|---|---|---|
| Analyzer | qwen-qwq-32b | qwen2.5:32b |
| Strategist | qwen-qwq-32b | qwen2.5:32b |
| Communicator | llama-4-scout | llama3.2:latest |

---

## Queue Overview (BullMQ)

| Queue | Trigger | Phase |
|---|---|---|
| `analyze-url` | POST /agents/analyze-url | Phase 1 |
| `generate-campaign-content` | POST /agents/generate-content | Phase 2 |
| `send-outreach` | Scheduler | Phase 3 |
| `warmup-execute` | Daily cron | Phase 2.5 |
| `phone-verify` | Lead creation | Phase 4 |
| `strategy-review` | Every 24-48h cron | Phase 5 |
| `compliance-check` | Pre-send gate | Phase 6 |

---

## Railway Deployment

Three separate Railway services:

```
api    → pnpm build:api    / pnpm start:api    / health: /api/health
worker → pnpm build:worker / pnpm start:worker / health: /health
web    → pnpm build:web    / pnpm start:web
```

Required Railway environment variables — set in each service:

```
DATABASE_URL
REDIS_URL
NEXTAUTH_SECRET
LLM_PROVIDER
GROQ_API_KEY
API_URL          (web service only — points to api service URL)
NODE_ENV=production
```

---

## Development Phases

| Phase | Status | Description |
|---|---|---|
| 0 — Skeleton | ✅ Done | Monorepo, DB schema, API, Worker, Frontend |
| 1 — Analyzer | ⏳ Next | URL scraping + ICP extraction (Qwen3-32B) |
| 2 — Communicator | ⬜ | Email sequences + call scripts (Llama 4 Scout) |
| 2.5 — Warmup | ⬜ | Email warmup + deliverability |
| 3 — Sending | ⬜ | SMTP pipeline + tracking |
| 4 — Phone | ⬜ | TCPA classification + Vapi.ai calling |
| 5 — Strategist | ⬜ | Self-improvement loop |
| 6 — Compliance | ⬜ | Full CAN-SPAM / TCPA / GDPR engine |

---

## Compliance Notes

- **CAN-SPAM**: Cold email to US targets — unsubscribe + physical address required
- **TCPA**: AI voice calls to mobile numbers require prior written consent
- **GDPR**: B2B cold email to EU allowed under legitimate interest (document LIA)
- **CASL**: Canada requires express or implied consent
- Phone classification: `can_call_ai` (green) / `can_call_manual` (yellow) / `cannot_call` (red)