# Planix — Handover Document and Claude Code Kickoff

**Date:** June 2026
**From:** Trent Martin, VP Technology Services, CHR Solutions
**Purpose:** Complete context handover for the Planix build. Read this before writing any code.

---

## What Planix Is

A production project management application built from scratch for CHR Solutions. Not a prototype. Not a proof of concept. A real tool used by real people across three business units managing real customer commitments.

It is designed to be better than Wrike, Microsoft Project, and ClickUp — not by cloning them, but by solving the problems that all three consistently fail at. The full competitive analysis is in the project docs folder.

The product name is **Planix**. It will be hosted at **planix.chrsolutions.com**.

---

## The Document Suite

Read these in order before touching any code.

| File | What It Contains |
|---|---|
| `CLAUDE.md` | Non-negotiable architecture rules, stack, project structure. Claude Code reads this automatically. |
| `docs/PRD.md` | Complete product requirements — all 21 sections. Features, business unit requirements, edge cases. |
| `docs/DESIGN_SYSTEM.md` | Color tokens, typography, component specs, dark mode rules. CSS custom property definitions. |
| `docs/ARCHITECTURE.md` | Database schema rules, API design, frontend structure, Phase 0 definition of done. |
| `docs/OPEN_QUESTIONS.md` | Decisions still pending. Do not make assumptions on these — flag them. |

---

## The Three Business Units (Know These)

**1. Managed IT Services and Cybersecurity**
Standard IT project work: patch cycles, infrastructure changes, security assessments. Uses formal CAB (Change Advisory Board) approval workflows. Projects often confidential. SLA commitments to customers. On-call schedules affect resource availability.

**2. Fiber Engineering and Construction Management**
Field crews. Physical locations. Tasks happen outdoors in areas with no cell signal. Field techs need GPS-aware task lists, photo capture on phones, and offline sync. Projects involve permits, right-of-way approvals, inspections, and punch lists.

**3. Software Development and Customer Activations**
Dev team uses Azure DevOps today. Agile/Scrum methodology. New customer activations are a repeatable process with hard SLA deadlines. The ADO integration is Phase 1, not Phase 2 — the dev team will not adopt Planix without it.

---

## The Five Biggest Technical Decisions to Make Before Coding

These are in `docs/OPEN_QUESTIONS.md` as OQ-001 through OQ-006. They must be answered before Phase 0 begins.

1. **Who is the technical lead?** (OQ-006) — One person owns architecture. Without this, decisions get made randomly.
2. **Gantt library?** (OQ-001) — Bryntum is the recommendation. Requires budget approval. Blocking for Phase 1.
3. **API framework?** (OQ-002) — Express or Fastify. Recommend Fastify.
4. **ORM/Query builder?** (OQ-003) — Prisma or Kysely. Recommend Kysely.
5. **Who builds it?** (OQ-005) — Internal, contractor, or hybrid.

---

## What Phase 0 Looks Like (The Starting Point)

Phase 0 is the skeleton. No features. Just the foundation that everything attaches to.

When Phase 0 is complete, you should be able to:
- Log in with a CHR Azure AD account
- See the Planix dark mode shell (sidebar, top bar, content zone)
- Toggle between dark and light mode
- See a placeholder dashboard with correct layout
- Confirm the database is running with the right schema

The complete Phase 0 definition of done is in `docs/ARCHITECTURE.md`.

---

## Claude Code Kickoff Prompt

**Use this prompt when starting a new Claude Code session to build Phase 0.**

Copy and paste this into Claude Code:

---

```
I am building Planix, a project management application for CHR Solutions. The full specification is in this project's docs folder. Before doing anything else, read CLAUDE.md in the project root, then read docs/ARCHITECTURE.md. Those two files contain the non-negotiable rules for this codebase.

I need you to build Phase 0. The complete definition of done for Phase 0 is at the bottom of docs/ARCHITECTURE.md under "Phase 0 Deliverables."

Here is the Phase 0 scope:

1. Set up the monorepo structure as defined in CLAUDE.md under "Project Structure." Use npm workspaces.

2. Create the PostgreSQL database schema for the core entities: Organization, Department, User, Role, Project, Phase, Task. All datetime columns must be TIMESTAMPTZ. All tables must have deleted_at TIMESTAMPTZ for soft delete. Create the audit_log table as an insert-only table. Write these as numbered migrations in database/migrations/.

3. Set up the Node.js TypeScript backend (packages/api) with the chosen API framework. Wire up Azure AD token validation middleware for internal users. Wire up email/password auth for customer portal users. All API routes prefixed /api/v1/. Use the response envelope shape from docs/ARCHITECTURE.md.

4. Set up the React TypeScript frontend (packages/web). Wire in i18next with an English translation file. Every user-facing string must use t() — no hardcoded strings in JSX. Set up CSS Modules.

5. Build the Planix UI shell:
   - The tokens.css file with all CSS custom properties from docs/DESIGN_SYSTEM.md
   - The [data-theme="light"] override block in the same file
   - The shell layout: sidebar (220px, --px-bg-shell), top bar (52px, --px-bg-shell), content zone (--px-bg-base)
   - The sidebar right border: 1px solid var(--px-border-subtle) — this is the only visual separator
   - Dark/light mode toggle button in the top bar. Sets data-theme on <html>. 150ms ease transition on color and background-color only.
   - On first load, read prefers-color-scheme and apply it as the default

6. The sidebar nav items: Dashboard, Projects, My Tasks, Team, Calendar, Reports, Settings. Active item style: 3px left border in --px-teal-500, background --px-teal-900-bg, text --px-teal-300. Inactive: --px-text-tertiary. Hover: rgba(255,255,255,0.04) background.

7. Set up basic routing: /login, /dashboard, /projects, /portal/login. These can render placeholder content — the goal is routing working correctly.

8. Set up the Azure DevOps CI/CD pipeline YAML in infrastructure/pipelines/. The pipeline must run: TypeScript compiler check (tsc --noEmit), linter, and database migration runner.

Do not build any feature-level functionality yet. No task management UI. No Gantt. No notifications. Just the skeleton defined above.

After each major piece, confirm what was built and what comes next. If you hit one of the open questions in docs/OPEN_QUESTIONS.md, stop and flag it rather than making an assumption.
```

---

## Tips for Working with Claude Code on This Project

**One session, one focus area.** Claude Code works best when you give it a specific, bounded task. "Build the task creation form" is good. "Build Planix" is not.

**Reference the docs, don't repeat them.** Claude Code reads CLAUDE.md automatically. For feature work, tell it which PRD section applies: "Build the Change Impact dialog as described in docs/PRD.md Section 8."

**Start every session with context.** If starting a new session mid-feature, briefly recap: "We are building the notification engine. The spec is in docs/PRD.md Section 11. The Teams integration requires the Graph API permissions listed there. We have already built the in-app notification inbox. Now we need the Teams DM delivery."

**The open questions list is your friend.** When Claude Code hits an architectural fork that is not in the spec, the right answer is to add it to OPEN_QUESTIONS.md and decide it explicitly rather than letting code make the decision for you.

**Test in both modes.** Every UI component must be checked in dark mode and light mode before it is done. Claude Code can do this if you ask it to verify the token usage is correct.

---

## Contacts and Context

| | |
|---|---|
| Product Owner | Trent Martin, VP Technology Services |
| Organization | CHR Solutions |
| App URL | planix.chrsolutions.com |
| Internal Auth | Azure AD (CHR tenant) |
| Teams Tenant | CHR Solutions Microsoft 365 tenant |
| ADO Organization | CHR Solutions Azure DevOps |
| Freshservice | CHR Solutions Freshservice instance |

---

## The Most Important Things to Get Right in Phase 0

1. **UTC datetime storage.** If you get this wrong in Phase 0, fixing it later requires a database migration touching every datetime column across the entire application. Get it right once.

2. **i18n wired in from day one.** If you ship Phase 0 with hardcoded strings and add i18next later, you are doing a full sweep of every component. Wire it in now, even though it is English-only.

3. **The sidebar color.** It matches the top bar. They are both `--px-bg-shell`. Do not make the sidebar a different color. This was an explicit design decision made after reviewing the mockups.

4. **The token file is the single source of truth.** Every color in the application comes from `tokens.css`. If a developer hardcodes a hex value in a component, that is a bug.

5. **The audit log is insert-only.** The database user that the application uses must not have `UPDATE` or `DELETE` permissions on the `audit_log` table. Set this up in Phase 0.
