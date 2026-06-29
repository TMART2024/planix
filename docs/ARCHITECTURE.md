# Planix — Architecture Document

**Version:** 0.1 (starter — to be expanded by technical lead)
**Status:** Decisions locked unless noted as OPEN in OPEN_QUESTIONS.md

---

## Stack Summary

| Layer | Technology | Status |
|---|---|---|
| Frontend | React 18+ with TypeScript, strict mode | Locked |
| Styling | CSS Modules + CSS custom properties | Locked |
| Internationalization | i18next | Locked — wire in Phase 0 |
| Backend | Node.js with TypeScript | Locked |
| API Framework | Fastify | Locked |
| Database | PostgreSQL 15+ | Locked |
| Query Builder | Kysely | Locked |
| Authentication (internal) | Azure AD via MSAL | Locked |
| Authentication (customer portal) | Planix-managed email/password | Locked |
| File Storage | Garage on CHR internal storage servers (S3-compatible, AGPL-3.0, no license file) | Locked |
| Maps | Mapbox GL JS | Locked |
| Charts | Chart.js 4.x | Locked |
| Gantt | Custom build, 3-phase delivery | Locked |
| Email | Nodemailer via CHR internal SMTP/Exchange | Locked |
| CI/CD | Coolify built-in deployment from Git | Locked |
| Hosting | Coolify on CHR internal hardware | Locked |
| Reverse Proxy / SSL | Traefik (built into Coolify) | Locked |
| AI Insights | Anthropic API (claude-sonnet-4-6) | Locked |
| Teams Integration | Microsoft Graph API (delegated permissions) | Locked |

---

## Database Schema Rules

### The Most Important Rule
**All datetime columns are `TIMESTAMPTZ` (timestamp with time zone).** PostgreSQL stores these as UTC internally. Application code never does timezone math — it stores UTC and lets the display layer convert.

```sql
-- Correct
planned_start_at  TIMESTAMPTZ NOT NULL,
planned_finish_at TIMESTAMPTZ NOT NULL,

-- Wrong — never do this
planned_start_at  TIMESTAMP WITHOUT TIME ZONE,
planned_start_at  VARCHAR, -- storing dates as strings
```

### Duration Storage
All durations stored as `INTEGER` (minutes). No `INTERVAL`. No `FLOAT`. No hours. The UI converts to `2h 30m` display format, but the database always sees an integer number of minutes.

```sql
estimated_duration_minutes  INTEGER NOT NULL DEFAULT 0,
actual_duration_minutes     INTEGER NOT NULL DEFAULT 0,
remaining_duration_minutes  INTEGER,
```

### Soft Delete
Every primary table has `deleted_at TIMESTAMPTZ` and `deleted_by UUID`. Application queries always include `WHERE deleted_at IS NULL` unless explicitly fetching deleted records for the recycle bin. Hard delete is never performed by application code.

### Audit Log Table
Separate `audit_log` table. Never updated or deleted by application code. Insert-only.

```sql
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entity_type   VARCHAR(100) NOT NULL,  -- 'task', 'project', 'user', etc.
  entity_id     UUID NOT NULL,
  action        VARCHAR(100) NOT NULL,  -- 'create', 'update', 'delete', 'login', etc.
  actor_id      UUID,                   -- NULL for system actions
  old_value     JSONB,
  new_value     JSONB,
  meta          JSONB                   -- reason, ip address, etc.
);
-- No DELETE or UPDATE permissions granted to application database user on this table
```

### Core Entity Relationships (simplified)

```
Organization
  └── Department (many per org)
       └── User (many per dept, users can belong to multiple depts)
       └── Project (many per dept)
            └── Phase (many per project, optional)
            └── Task (many per project)
                 └── Subtask (unlimited nesting via parent_id self-reference)
                 └── Dependency (source_task_id, target_task_id, type, lag_minutes)
                 └── TimeLog (user_id, duration_minutes, logged_at)
                 └── Comment (user_id, body, created_at)
                 └── Attachment (file_url, filename, file_size, uploaded_by)
            └── Baseline (snapshot of schedule at a point in time)
            └── RestorePoint (auto-snapshot on every schedule change)
            └── PMIForm (form_type, content JSONB, version)
            └── Template (from this project or org library)
  └── Customer (org's external clients)
       └── WhiteLabelProfile (logo_url, accent_color, display_name, footer_text)
       └── CustomerProject (project_id, customer_id, visibility settings)
```

## Infrastructure and Deployment

### Coolify Setup

Coolify manages the Planix deployment on CHR hardware. Each component deploys as a Docker container.

**Services in Coolify:**
- `planix-web` — React frontend (Nginx serving static build)
- `planix-api` — Fastify Node.js backend
- `planix-db` — PostgreSQL (or point to existing internal PostgreSQL instance)
- `planix-minio` — MinIO object storage
- `planix-redis` — Redis for session storage and job queues (if needed)

**Deployment flow:**
1. Push to main branch in Git repo
2. Coolify detects the push via webhook
3. Coolify builds the Docker image using the Dockerfile in each package
4. Coolify runs database migrations before swapping the container
5. New container goes live, old one stops

**Environment variables** are managed in Coolify's UI, not in .env files committed to the repo. The Anthropic API key, database credentials, and MinIO credentials live in Coolify's secret store.

### Dockerfiles

Each package needs a Dockerfile:

**packages/api/Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**packages/web/Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Garage Configuration

Garage is the S3-compatible object storage for file attachments, report PDFs, customer logos, and field photos. It runs as a Docker container via Coolify on CHR internal storage servers. No license file. No phone-home. No expiration risk.

**Why Garage over the alternatives:**
- AIStor Free: requires a license file that renews from MinIO servers every 24h. If renewal fails, storage goes read-only then offline.
- RustFS: Apache 2.0 license is cleaner, but the project's own Docker Hub page says "Do NOT use in production." Beta as of mid-2026.
- Garage: AGPL-3.0, in production since 2020, no external dependencies, single Docker container, trivial to operate.

```typescript
// packages/api/src/config/storage.ts
import { S3Client } from '@aws-sdk/client-s3';

export const storageClient = new S3Client({
  endpoint: process.env.GARAGE_ENDPOINT,    // e.g. http://planix-garage:3900
  region: 'garage',                          // Garage accepts any region string
  credentials: {
    accessKeyId: process.env.GARAGE_ACCESS_KEY!,
    secretAccessKey: process.env.GARAGE_SECRET_KEY!,
  },
  forcePathStyle: true,                      // Required for Garage
});
```

**Garage Docker Compose (via Coolify):**
```yaml
services:
  planix-garage:
    image: dxflrs/garage:v2.3.0
    container_name: planix-garage
    restart: unless-stopped
    ports:
      - "3900:3900"   # S3 API
      - "3903:3903"   # Admin API
    volumes:
      - ./garage.toml:/etc/garage.toml:ro
      - garage-meta:/var/lib/garage/meta
      - garage-data:/var/lib/garage/data
volumes:
  garage-meta:
  garage-data:
```

**Initial bucket setup (run once after first deploy):**
```bash
docker exec planix-garage garage key create planix-key
docker exec planix-garage garage bucket create planix-attachments
docker exec planix-garage garage bucket create planix-reports
docker exec planix-garage garage bucket create planix-logos
docker exec planix-garage garage bucket create planix-photos
docker exec planix-garage garage bucket allow planix-attachments --key planix-key
docker exec planix-garage garage bucket allow planix-reports --key planix-key
docker exec planix-garage garage bucket allow planix-logos --key planix-key
docker exec planix-garage garage bucket allow planix-photos --key planix-key
```

Buckets:
- `planix-attachments` — task file attachments
- `planix-reports` — generated PDF reports
- `planix-logos` — customer white-label logos
- `planix-photos` — field task photos (construction)

### Email via Nodemailer

```typescript
// packages/api/src/config/email.ts
import nodemailer from 'nodemailer';

export const emailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // CHR internal Exchange/SMTP server
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,                     // STARTTLS
  auth: {
    user: process.env.SMTP_USER,    // planix@chrsolutions.com service account
    pass: process.env.SMTP_PASS,
  },
});
```

The from address for all Planix emails: `Planix <planix@chrsolutions.com>` for internal notifications. Customer-facing emails: `CHR Solutions Project Updates <projects@chrsolutions.com>`.

### External Firewall Requirements

Only two outbound HTTPS connections leave the data center:
- `api.anthropic.com:443` — AI Insights Engine
- `graph.microsoft.com:443` — Teams integration and Azure AD SSO (also `login.microsoftonline.com:443`)

Verify these are permitted before Phase 0 deployment testing.

### Migration Conventions

Numbered sequentially, zero-padded to 4 digits:
```
database/migrations/
  0001_initial_schema.sql
  0002_add_audit_log.sql
  0003_add_whitelist_profile.sql
```

Every migration includes a rollback section:
```sql
-- migrate
CREATE TABLE ...;

-- rollback
DROP TABLE IF EXISTS ...;
```

---

## API Design

### Versioning
All routes prefixed with `/api/v1/`. When a breaking change is required in the future, `/api/v2/` is introduced alongside (not replacing) v1.

### Response Envelope
Every API response uses this shape:

```typescript
// Success
{
  data: T,
  meta?: {
    page?: number,
    pageSize?: number,
    total?: number,
  }
}

// Error
{
  error: {
    code: string,      // machine-readable: 'TASK_NOT_FOUND', 'VALIDATION_ERROR'
    message: string,   // human-readable
    details?: Record<string, string>  // field-level validation errors
  }
}
```

HTTP status codes are used semantically:
- `200` success
- `201` created
- `400` validation error
- `401` unauthenticated
- `403` unauthorized
- `404` not found
- `409` conflict
- `422` unprocessable entity
- `500` server error

### Authentication Flow (Internal Users)
1. Frontend initiates MSAL login, receives Azure AD token
2. Token sent to `/api/v1/auth/login` as Bearer
3. Backend validates token with Azure AD, creates/updates user record
4. Backend returns a short-lived JWT for API use
5. JWT refreshed via `/api/v1/auth/refresh` before expiry

### Authentication Flow (Customer Portal Users)
1. Email/password POST to `/api/v1/auth/portal/login`
2. Backend validates credentials, returns JWT scoped to that customer's data only
3. Customer JWT has a `customer_id` claim — all queries are scoped to this customer

---

## Frontend Architecture

### State Management
Context API for global state (auth, theme, current user). React Query (TanStack Query) for server state (data fetching, caching, mutations). Local component state for UI-only state.

### Folder Structure (web package)

```
src/
  components/       # Reusable, stateless UI components
    Button/
      Button.tsx
      Button.module.css
      Button.test.tsx
  pages/            # Page-level components, wired to routes
  hooks/            # Custom React hooks (useTasks, useProject, etc.)
  stores/           # Context providers
  api/              # API client functions (typed with the response envelope)
  tokens/           # tokens.css (the single source of truth for CSS vars)
  i18n/
    en.json         # English strings (the only file at launch)
    index.ts        # i18next configuration
  types/            # TypeScript interfaces shared across components
  utils/            # Pure utility functions
  App.tsx
  main.tsx
```

### i18n Setup (Phase 0 — Required)

```typescript
// i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});

export default i18n;
```

```typescript
// Usage in every component — no hardcoded strings
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
return <button>{t('task.markComplete')}</button>;
```

Even though we only have English at launch, every string goes through `t()`. Retrofitting this later is expensive and disruptive.

---

## Phase 0 Deliverables (Definition of Done)

Phase 0 is complete when all of the following are true:

- [ ] PostgreSQL database running with the core schema (Org, Dept, User, Role, Project, Phase, Task tables with UTC datetimes)
- [ ] All datetime columns are `TIMESTAMPTZ` — verified with a migration test
- [ ] Azure AD SSO login works end-to-end for a CHR internal user
- [ ] Email/password login works for a customer portal user (separate JWT scope)
- [ ] The Planix UI shell renders in dark mode with correct color tokens from `tokens.css`
- [ ] The sidebar (`--px-bg-shell`) and top bar (`--px-bg-shell`) match — no contrasting sidebar color
- [ ] Dark/light mode toggle works: `data-theme` attribute switches, CSS variables update, no flash
- [ ] i18next is wired in and all strings in the shell use `t()` — verified by grep for hardcoded user-facing strings
- [ ] `/api/v1/health` endpoint returns 200 with system status
- [ ] Coolify deployment configured: Git repo connected, webhook active, builds on push to main
- [ ] TypeScript compiler check (`tsc --noEmit`) runs as part of the Docker build — zero errors
- [ ] Linter runs as part of the Docker build — zero errors
- [ ] Database migration runner works (up and rollback)
- [ ] Garage deployed via Coolify, four buckets created (planix-attachments, planix-reports, planix-logos, planix-photos), test upload and download via AWS S3 SDK successful
- [ ] Basic routing: `/dashboard`, `/projects`, `/login`, `/portal/login` render without errors
