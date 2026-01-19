# External Integrations

**Analysis Date:** 2025-01-20

## APIs & External Services

**None detected.**

This application is self-contained with no external API integrations. All data is stored locally in the database.

## Data Storage

**Database:**
- MariaDB 10.11 (MySQL-compatible)
  - Connection: `DATABASE_URL` env var
  - Client: Prisma ORM (`@prisma/client`)
  - Schema: `prisma/schema.prisma`
  - Singleton client: `src/lib/prisma.ts`

**Database Schema:**
- `initiatives` - Core planning items (28 initiatives)
- `comments` - Comments on initiatives
- `events` - Company events (revenue tracking)
- `events_to_attend` - Industry events for networking

**File Storage:**
- Local filesystem only
- Excel file for initial data import: `MotionVii_SAAP_2026.xlsx`

**Caching:**
- None configured

## Authentication & Identity

**Auth Provider:**
- None implemented

**Current State:**
- No authentication or authorization
- All users have full access
- Suitable for internal/trusted network use only

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Console logging only (`console.log`, `console.error`)
- No structured logging framework

**Telemetry:**
- Next.js telemetry disabled (`NEXT_TELEMETRY_DISABLED=1` in Dockerfile)

## CI/CD & Deployment

**Hosting:**
- Self-hosted on Synology NAS
- Docker containerized deployment

**CI Pipeline:**
- None configured
- Manual deployment via `deploy.sh` script

**Deployment Process:**
1. Build Docker containers
2. Start containers with docker-compose
3. Wait for database readiness
4. Run Prisma migrations (`prisma db push`)
5. Verify container status

**Deployment Files:**
- `Dockerfile` - Multi-stage build (builder + runner)
- `docker-compose.yml` - Standard deployment
- `docker-compose.nas.yml` - NAS-specific with low CPU priority
- `deploy.sh` - Deployment automation script
- `run-migrations.sh` - Database migration helper

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - MySQL connection string
  - Format: `mysql://user:password@host:port/database`
  - Example: `mysql://saap_user:saap_password_2026@db:3306/saap2026`

**Optional env vars:**
- `NODE_ENV` - development/production (defaults to development)

**Env files:**
- `.env` - Local development
- `.env.example` - Template for setup
- `.env.nas` - NAS deployment overrides

**Secrets location:**
- Environment variables via `.env` files
- Docker compose environment section
- No external secrets manager

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Network Configuration

**Ports:**
- 3000 - App (standard)
- 3002 - App (NAS deployment, avoids conflicts)
- 3306 - Database (internal)
- 3307 - Database (standard external)
- 3308 - Database (NAS external)

**DNS/Routing:**
- Local access: `http://192.168.1.20:3002`
- Public access planned: `https://saap.motionvii.com` (via Cloudflare tunnel)

## Data Import

**Excel Import:**
- Source: `MotionVii_SAAP_2026.xlsx`
- Script: `prisma/seed.ts`
- Library: `xlsx` package
- Run: `npm run db:seed`

**Import Process:**
1. Read Excel file with `xlsx` library
2. Parse initiatives from main sheet (rows 7+)
3. Parse events from "Events to Attend" sheet
4. Clear existing data
5. Insert parsed records via Prisma

---

*Integration audit: 2025-01-20*
