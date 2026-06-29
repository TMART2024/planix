# CLAUDE.md — Planix Project Context

## What This Project Is

Planix is a multi-user, multi-departmental project management application built for CHR Solutions, hosted at planix.chrsolutions.com. It is a ground-up custom build designed to surpass Wrike, Microsoft Project, and ClickUp in usability, scheduling depth, and intelligence.

This is not a prototype. This is a production application for a real organization with three distinct business units: Managed IT Services and Cybersecurity, Fiber Engineering and Construction Management, and Software Development and Customer Activations.

## Where to Find the Full Specification

All feature and design decisions are documented. Read these before writing any code for a new feature area.

- `docs/PRD.md` — Complete product requirements. All features, all business units, all edge cases.
- `docs/DESIGN_SYSTEM.md` — Color tokens, typography, component specs, dark/light mode, accessibility rules.
- `docs/ARCHITECTURE.md` — Technical architecture decisions, stack, database schema approach, API design.
- `docs/OPEN_QUESTIONS.md` — Decisions still pending. Check this before making an assumption.

## Technology Stack

All decisions locked. Do not deviate without explicit approval from Trent Martin.

**Frontend:** React 18+ with TypeScript (strict mode). CSS Modules for component styles. i18next for internationalization (wired in Phase 0, English-only at launch). Inter variable font via Google Fonts.

**Backend:** Node.js with TypeScript. Fastify as the API framework. REST API. All routes versioned at /api/v1/.

**Database:** PostgreSQL. All datetime columns are TIMESTAMPTZ (UTC). No exceptions. Kysely as the type-safe query builder.

**Authentication:** Azure AD SSO via MSAL for internal CHR users. Email/password (Planix-managed) for customer portal users.

**Hosting:** Coolify on CHR internal hardware. Docker containers. Traefik reverse proxy and SSL handled by Coolify.

**Maps:** Mapbox GL JS. Free tier covers internal usage.

**Charts:** Chart.js 4.x.

**Gantt:** Custom build. No commercial library. Three-phase delivery (see CLAUDE.md section below and docs/PRD.md Section 22).

**Teams Integration:** Microsoft Graph API with delegated permissions only. Full permission list in docs/PRD.md Section 11.

**File Storage:** Garage on CHR internal storage servers (deuxfleurs-org/garage). S3-compatible, Apache-licensed core concept but AGPL-3.0 — zero cost, zero license file, zero phone-home. The Node.js AWS S3 SDK connects to Garage identically to AWS S3 (just change the endpoint). No files stored in the database.

**Email:** Nodemailer connecting to CHR internal SMTP/Exchange server. No third-party email service.

**CI/CD:** Coolify built-in deployment, triggered from Git repo push. No Azure DevOps pipeline YAML required.

**AI Insights:** Anthropic API (claude-sonnet-4-6). Server-side only. The only external service cost in the entire application.

**External network dependencies (the only two outbound calls Planix makes):**
- api.anthropic.com — AI Insights Engine
- graph.microsoft.com — Teams integration and Azure AD SSO

Verify with CHR infrastructure team that outbound HTTPS to both endpoints is permitted from the data center firewall.

## Non-Negotiable Architecture Rules

Read these before touching any code. They cannot be changed without VP approval.

1. **All datetimes are UTC in the database.** Display converts to the user's configured time zone at the UI layer. Never store local time. Never do timezone math in the database.

2. **All color values in the UI use CSS custom properties from the design system token file.** No hardcoded hex values in component code. This is what makes dark/light mode work.

3. **i18n strings are externalized from day one.** Use i18next. Every user-facing string goes through the translation function even while we only have English. Retrofitting this later is expensive.

4. **No Planix branding in customer-facing output.** Reports, portal pages, and notification emails delivered to external customers must use the customer's white-label profile. The string "Planix" must never appear in any customer-facing template.

5. **Soft delete only.** Nothing is hard deleted immediately. Deleted records go to a recycle bin with a 90-day recovery window. Permanent deletion requires admin confirmation and creates an audit log entry.

6. **Every significant action creates an audit log entry.** The audit log is immutable. No code path should allow editing or deleting audit records.

7. **The sidebar background matches the content area.** The UI uses a unified dark shell. Sidebar background token: --px-bg-shell (#111929 dark, #F8FAFB light). Do not introduce a contrasting sidebar color.

8. **Status colors are sacred.** Green = on track/complete. Amber = at risk. Red = overdue/critical. Orange = blocked. Purple = on hold. Teal = in progress (and brand accent). These are never overridden by customer brand colors in status indicators.

9. **Auto-save every 30 seconds.** Unsaved changes are held in browser local storage as a draft between saves. On reconnect after a dropped connection, the draft is recovered.

10. **Minute-level time granularity everywhere.** Task durations, estimates, and time logs are in minutes. The UI converts to display format (2h 30m) but the stored value is always minutes as an integer.

## Project Structure (Target)

```
planix/
├── CLAUDE.md
├── HANDOVER.md
├── docs/
│   ├── PRD.md
│   ├── DESIGN_SYSTEM.md
│   ├── ARCHITECTURE.md
│   └── OPEN_QUESTIONS.md
├── packages/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page-level components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── stores/         # State management
│   │   │   ├── api/            # API client layer
│   │   │   ├── tokens/         # CSS custom property definitions
│   │   │   ├── i18n/           # Translation files
│   │   │   └── types/          # Shared TypeScript types
│   ├── api/                    # Node.js backend
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Database access layer
│   │   │   ├── middleware/      # Auth, logging, error handling
│   │   │   ├── jobs/           # Background jobs and schedulers
│   │   │   └── types/          # Shared TypeScript types
│   └── shared/                 # Types and utilities shared between packages
├── database/
│   ├── migrations/             # PostgreSQL migrations (numbered sequentially)
│   └── seeds/                  # Development seed data
└── infrastructure/
    ├── azure/                  # Azure resource definitions
    └── pipelines/              # Azure DevOps pipeline YAML files
```

## Current Phase

**Phase 0 — Foundation.** The goal of Phase 0 is to have a running application shell with:
- Authenticated login via Azure AD (SSO) and email/password (customer portal path)
- The organizational data model in the database (Org, Department, User, Role)
- The project data model (Project, Phase, Task, Subtask) with UTC datetime storage
- The Planix UI shell rendering in dark mode with the correct color tokens
- The left sidebar, top bar, and content zone layout wired up
- Dark/light mode toggle working
- i18n infrastructure wired in (English strings only)
- CI/CD pipeline running on Azure DevOps

Phase 0 does not include Gantt charts, task management UI, notifications, or any feature-level work. It is the skeleton that everything else attaches to.

## Key Contacts

- **Product Owner / VP Technology Services:** Trent Martin
- **Organization:** CHR Solutions
- **Hosted at:** planix.chrsolutions.com

## Writing Code for This Project

- TypeScript strict mode. No `any` types without a comment explaining why.
- All API responses use a consistent envelope: `{ data, error, meta }`.
- Database migrations are numbered sequentially: `0001_initial_schema.sql`, `0002_add_audit_log.sql`, etc.
- Every migration is reversible. Include a `-- rollback` section.
- API routes are versioned: `/api/v1/...`.
- Errors are never swallowed silently. Log them, return a consistent error shape.
- Component files: PascalCase. Hook files: camelCase starting with `use`. Utility files: camelCase.
- CSS Module files co-located with their component: `Button.tsx` and `Button.module.css` in the same folder.

## Gantt Chart Architecture (Custom Build — No External Library)

The Gantt is custom built in three phases. Do not suggest or install any commercial Gantt library.

**Rendering approach:** Three synchronized layers:
1. **Left panel:** React with virtual scrolling (react-virtual) for the task list
2. **Timeline:** HTML5 Canvas for bar rendering (never DOM elements per bar — too slow at scale)
3. **Arrows:** SVG layer positioned over the Canvas for dependency arrows

**Phase 1 Gantt scope:** Month and week zoom only. Finish-to-Start dependencies only. Drag-to-move bars (date change). Baseline overlay. Critical path. Milestones. Progress lines.

**Phase 2 adds:** All four dependency types. Day zoom. Drag-to-resize. Constraint enforcement.

**Phase 3 adds:** Hour zoom with time-of-day rendering. Multi-page PDF export using jsPDF. Network Diagram view.

**Key math:** pixelsPerMinute = canvasWidth / (visibleEndMinutes - visibleStartMinutes). All bar positions calculated from this. All calculations use working minutes against the project calendar, never wall clock time.

**Kanban, Sprint Board, Calendar, Timeline, Workload views** are standard React components using dnd-kit for drag-and-drop. Not affected by the custom Gantt decision.

## AI Insights Engine (Anthropic API)

The Anthropic API is the only permitted external cost. All AI calls are server-side only.

- Model: claude-sonnet-4-6
- API key: server-side environment variable only. Never exposed to frontend.
- Streaming: Server-Sent Events from Node.js backend to frontend
- Context assembly: a dedicated ContextAssembler service formats project data before sending
- Rate limiting: 20 AI Insights requests per user per day (admin-configurable)
- No project data is stored by Anthropic beyond the API call

The AI Insights panel is a right-side drawer in the project view, 400px wide. Responses stream in real time. Pre-built analyses available alongside free-text questions. See docs/PRD.md Section D for the full feature spec.
