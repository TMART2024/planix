## Infrastructure Decisions (All Locked)

| Component | Decision | Date |
|---|---|---|
| Hosting platform | Coolify (self-hosted on CHR hardware) | June 2026 |
| Deployment | Coolify built-in deployment from Git repo | June 2026 |
| Containers | Docker via Coolify | June 2026 |
| File storage | Garage on CHR internal storage servers (S3-compatible, AGPL-3.0, no license file, no phone-home) | June 2026 |
| Email | Nodemailer via CHR internal SMTP/Exchange | June 2026 |
| Database | PostgreSQL via Coolify or existing internal server | June 2026 |
| SSL/Reverse proxy | Traefik (built into Coolify) | June 2026 |
| API framework | Fastify | June 2026 |
| ORM/Query builder | Kysely | June 2026 |
| Gantt library | Custom build (no commercial library) | June 2026 |
| External cost policy | Anthropic API only | June 2026 |

**External network dependencies (only two):**
- `api.anthropic.com` — AI Insights Engine
- `graph.microsoft.com` — Teams integration and Azure AD SSO

Verify with CHR infrastructure team that outbound HTTPS to these two endpoints is permitted from the data center.

---

# Planix — Open Questions and Decision Log

Decisions still pending. **Do not make assumptions on these items.** If you encounter one while coding, stop and flag it rather than guessing.

When a decision is made, update this file: move the item to the Resolved section, add the decision and the date.

---

## Open

### ~~OQ-001 — Gantt Library Selection~~ CLOSED
**Question:** Bryntum Gantt vs. dhtmlxGantt vs. custom build?
**Why it matters:** This is the most consequential architectural choice in Phase 1. The Gantt library must support: hour-zoom timeline with time-of-day bar rendering, multi-page PDF export, baseline bar overlay, custom theming to match Planix design tokens, drag-and-drop with dependency drawing, and minute-level precision. A wrong choice here costs months.
**Recommendation:** Evaluate Bryntum Gantt first. Get a trial license and build a proof-of-concept with the Planix dark theme before committing. Bryntum has all required features built in. Custom build adds 4–6 months minimum.
**Decision needed from:** Trent Martin (budget approval for Bryntum license ~$2–5K/year)
**Decision:** Custom build. Three-phase delivery plan. See PRD.md Section 22.
**Decided by:** Trent Martin
**Date:** June 2026
**Rationale:** Zero external costs policy. Custom Gantt built in phases: Phase 1 (month/week zoom, FS deps), Phase 2 (all dep types, day zoom), Phase 3 (hour zoom, PDF export).

---

### ~~OQ-002 — API Framework~~ CLOSED
**Question:** Express or Fastify for the Node.js backend?
**Why it matters:** Fastify is significantly faster and has better TypeScript support out of the box. Express has more ecosystem packages but more boilerplate for TypeScript. Either works.
**Recommendation:** Fastify. The performance advantage matters at scale and the TypeScript DX is better.
**Decision:** Fastify.
**Decided by:** Trent Martin
**Date:** June 2026
**Rationale:** Better TypeScript DX, built-in schema validation, cleaner for a large API surface.

---

### ~~OQ-003 — ORM / Query Builder~~ CLOSED
**Question:** Prisma or Kysely for database access?
**Why it matters:** Prisma is easier to get started with but generates less efficient queries for complex joins. Kysely is a type-safe query builder that gives more control, closer to raw SQL, better for a scheduling engine with complex queries.
**Recommendation:** Kysely for the scheduling-heavy backend. It handles the complex join patterns the Gantt and EVM calculations require without Prisma's abstraction overhead.
**Decision:** Kysely.
**Decided by:** Trent Martin
**Date:** June 2026
**Rationale:** Full SQL control for complex scheduling engine queries. Prisma hits its ceiling on the EVM and Gantt data patterns. No migration needed later.

---

### ~~OQ-004 — Email Service~~ CLOSED
**Question:** Azure Communication Services or SendGrid for transactional email?
**Why it matters:** Customer-facing report delivery emails, notification emails, and customer portal invite emails. Azure Communication Services is simpler if already in Azure. SendGrid has better deliverability tooling and analytics.
**Recommendation:** Azure Communication Services if CHR already has Azure spend. SendGrid otherwise.
**Decision:** Nodemailer via CHR internal SMTP/Exchange. No third-party email service. Zero cost.
**Decided by:** Trent Martin
**Date:** June 2026
**Rationale:** Self-hosted on Coolify. CHR has internal mail infrastructure. Nodemailer connects directly via SMTP.

---

### OQ-005 — Who Builds Planix
**Question:** Internal team, contractor, or hybrid?
**Why it matters:** Affects timeline, IP ownership, and code quality consistency.
**Status:** Unknown. Needed before Phase 0 can begin.
**Decision needed from:** Trent Martin

---

### ~~OQ-006 — Technical Lead~~ CLOSED
**Question:** Who is the technical lead for Planix?
**Why it matters:** The technical lead must own and make the architecture decisions in OQ-001 through OQ-004 before a line of production code is written. Without a technical lead, these decisions get made ad hoc by whoever is coding that day, which creates inconsistency.
**Status:** Unknown. Needed before Phase 0 can begin.
**Decision needed from:** Trent Martin
**Decision:** Trent Martin is technical lead and sole developer. Claude Code (VS Code) is the AI development assistant. Wrike Circle group provides user feedback.
**Decided by:** Trent Martin
**Date:** June 2026

---

### OQ-007 — Pilot Department
**Question:** Which CHR department tests Phase 1?
**Why it matters:** The answer drives which department templates, PMI forms, and integrations to prioritize first. IT first means ADO integration and CAB workflow are most important. Construction first means the map view and field task features are most important. Software/activations first means the sprint board and ADO sync are most important.
**Decision needed from:** Trent Martin

---

### OQ-008 — Phase 1 MVP Scope
**Question:** What is the minimum Phase 1 feature set that makes a PM immediately prefer Planix over their current tool?
**Why it matters:** Phase 1 cannot be "build everything in the PRD." It needs a hard scope limit. The PRD describes the full vision. Phase 1 is the slice that proves the concept and earns user trust.
**Suggested Phase 1 MVP:** Task management (create, assign, status, priority), basic Gantt with FS dependencies, milestone tracking, in-app messaging, dark mode UI shell, Azure AD login, and ADO sync for the dev team.
**Decision needed from:** Trent Martin

---

### OQ-009 — Customer Portal Custom Domain (Phase Timing)
**Question:** Can customer portal custom domains (projects.customerdomain.com) move earlier than Phase 6?
**Why it matters:** If a key enterprise customer requires it before Phase 6, it needs to move into Phase 3 planning. Requires DNS CNAME and SSL cert provisioning per customer.
**Default:** Phase 6.
**Decision needed from:** Trent Martin (only if a specific customer requires it earlier)

---

### OQ-010 — Freshservice API Access
**Question:** Does CHR's current Freshservice plan include API access?
**Why it matters:** The ticket-to-project escalation feature (PRD Section 12.3) requires Freshservice API. If the current plan does not include it, it either requires a plan upgrade or the feature moves to a later phase.
**Decision needed from:** Trent Martin (check Freshservice contract)

---

## Resolved

*Nothing resolved yet. Decisions move here when made.*

**Format for resolved decisions:**
```
### OQ-XXX — [Title]
**Decision:** [What was decided]
**Decided by:** [Name]
**Date:** [Date]
**Rationale:** [Why]
```
