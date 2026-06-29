# Planix — Product Requirements Document

**Version:** 0.5 (consolidated)
**Owner:** Trent Martin, VP Technology Services, CHR Solutions
**Status:** Approved specification. Do not deviate without VP sign-off.

---

## 1. Product Vision

Planix is a multi-user, multi-departmental project management platform built for CHR Solutions. It serves three distinct business units with fundamentally different project types: fiber engineering and construction, software development and customer activations, and managed IT services and cybersecurity. One platform. All three. No compromises.

**The mission:** Build the project management tool that people actually wish they had.

### Core Design Principles

- **Progressive disclosure:** simple by default, powerful when you need it
- **Built for teams, not just the PM:** collaboration is the foundation, not an add-on
- **Intelligence built in, not bolted on:** AI coaching, change impact analysis, scheduling suggestions are native
- **PMI-aligned without being PMI-required:** full artifact library available, never forced
- **Multi-departmental by architecture:** departments are a first-class data concept from day one
- **Minute-level precision throughout:** all time stored and calculated in minutes
- **Field-ready:** works for a tech in a bucket truck as well as a PM at a desk
- **Developer-native:** speaks Azure DevOps, Agile, and sprint planning fluently

---

## 2. User Personas

| Persona | Who They Are | Key Needs |
|---|---|---|
| Team Member | Individual contributor | My tasks, status updates, messaging, time logging |
| Field Tech | Construction crew in the field | GPS task list, photo capture, mark complete, offline mode |
| Project Manager | Owns the project plan | Full scheduling, messaging, change management, reporting |
| Developer | Software team member | Sprint board, backlog, ADO sync, burndown, PR status |
| Department Head | Oversees all dept projects | Dept dashboard, resource utilization, budget rollup |
| Executive | High-level visibility only | Portfolio RAG status, milestones, budget health |
| Customer (External) | Client with a login portal | Their projects only, curated view, no internal data |
| External Stakeholder | One-off share link | Read-only curated view, no account required |
| System Admin | Manages the Planix instance | User mgmt, dept config, permissions, integrations |

---

## 3. Organizational Architecture

### Hierarchy
- **Organization** (CHR Solutions — top level)
- **Departments** (IT, Finance, HR, Operations, etc.)
  - Each has its own project space, templates, and resource pool
  - Department heads see all projects in their department
  - Cross-department visibility is explicitly granted, never automatic
- **Projects** (belong to a primary department, can include cross-dept team members)
- **Phases** (optional grouping of tasks within a project)
- **Tasks** (belong to a project, assigned to users regardless of department)
- **Subtasks** (unlimited nesting depth)

### Permission Roles

| Role | Scope | Key Permissions |
|---|---|---|
| Team Member | Assigned projects only | View/update assigned tasks, comments, messaging, time logging |
| Project Manager | Owned projects | Full project control, scheduling, team messaging, reporting |
| Department Head | All dept projects | All PM permissions across dept, resource view, budget, templates |
| Executive | Org-wide read | Portfolio dashboard, milestone tracking, RAG status |
| Customer (External) | Their projects only | Curated read-only portal, optional request submission |
| External Stakeholder | Shared view only | Read-only link, no account required |
| System Admin | Org-wide | User management, department config, integrations, audit logs |

---

## 4. Task Management

### Non-Negotiable Rule
**Everything involving time in Planix is expressed in minutes.** Stored as integer minutes. Displayed as `2h 30m` or `45m`. Never raw minutes to the user, never fractional hours in the database.

### Standard Task Fields
- Task name, rich text description
- Task type (Task, Story, Bug, Epic, Feature, Defect, Action Item, custom)
- Assignee(s) — multiple allowed
- Status (customizable per project)
- Priority (Critical, High, Normal, Low)
- Story points (alternative to duration for Agile projects)
- Estimated duration (integer minutes)
- Actual duration (integer minutes, via timer or manual entry)
- Remaining duration (auto-calculated or manual)
- Planned start datetime (UTC timestamptz)
- Planned finish datetime (UTC timestamptz)
- Actual start datetime (UTC timestamptz)
- Actual finish datetime (UTC timestamptz)
- Baseline start datetime (locked at baseline, never overwritten)
- Baseline finish datetime (locked at baseline, never overwritten)
- Variance from baseline (calculated, displayed in minutes and days)
- Dependencies (type: FS/SS/FF/SF/External, lead/lag in minutes)
- Constraint type (8 types — see Section 6)
- Milestone flag
- Location (address or lat/long for field tasks)
- SLA deadline (UTC timestamptz)
- External dependency flag with external owner and status
- Sign-off required flag
- Tags, custom fields, attachments, checklists, watchers
- ADO work item ID (for dev tasks synced with Azure DevOps)
- Change log (full audit trail on this task)

### Views Available
List, Board/Kanban, Gantt, Sprint Board, Backlog, Calendar, Timeline, Workload, Network Diagram, Map (construction), My Tasks, Team, Mind Map, Mobile condensed

---

## 5. Agile and Developer Features

### Backlog Management
- First-class Backlog view (not just a list with no sprint assigned)
- Backlog grooming: sort by priority, story points, business value, bulk editing
- Epic grouping, dependency visualization, Definition of Ready checklist
- Sequential estimation mode (planning poker style)

### Sprint Management
- Sprint containers with start date, end date, sprint goal
- Sprint planning: drag stories from backlog into sprint
- Sprint capacity calculation based on team availability
- Over-commitment warning
- Sprint board with customizable status columns
- Sprint review checklist, sprint retrospective template
- Sprint locking with scope change approval after sprint starts
- Mid-sprint scope change log

### Charts
- Burndown (remaining work vs. time, ideal line, scope change line)
- Burnup (work completed vs. total scope)
- Velocity (story points per sprint over time, rolling average)
- Cumulative Flow Diagram (work items by status column over time)

### Daily Standup Support
- Standup view pre-populated from task activity
- Blockers flagged in standup become blocked tasks
- PM sees team standup summary in one view

### Azure DevOps Integration (Phase 1 — bidirectional)
- OAuth authentication via Azure AD
- ADO Epics → Planix Phases, ADO User Stories → Planix Tasks, ADO Tasks → Planix Subtasks
- PR and pipeline status visible on Planix task card
- Sprint sync: ADO iterations appear as Planix sprint containers
- Status changes sync both ways in real time via webhook (not polling)
- Conflict resolution: most recent write wins, conflict noted in audit log

---

## 6. Scheduling Engine

### All Four Dependency Types
| Type | Code | Meaning |
|---|---|---|
| Finish-to-Start | FS | B cannot start until A finishes |
| Start-to-Start | SS | B cannot start until A starts |
| Finish-to-Finish | FF | B cannot finish until A finishes |
| Start-to-Finish | SF | B cannot finish until A starts |
| External | EXT | B blocked by a party outside the project |

**Lead and Lag:** Both expressed in minutes. Lag = buffer. Lead = overlap. Calculated in working minutes against the project calendar.

### Eight Task Constraint Types
1. As Soon As Possible (default)
2. As Late As Possible
3. Must Start On
4. Must Finish On
5. Start No Earlier Than
6. Start No Later Than
7. Finish No Earlier Than
8. Finish No Later Than

### Three Task Scheduling Modes
- **Effort-Driven:** adding a second person halves the duration
- **Fixed Duration:** adding resources does not change the schedule
- **Fixed Work:** total work hours locked, duration and resources adjust

### Calendar System (Four Levels)
1. Organization calendar (company-wide working days and holidays)
2. Department calendars (department-specific non-working days)
3. Resource calendars (individual working hours, vacation, on-call periods)
4. Task calendars (task-specific working hours, e.g., maintenance windows)

All four interact correctly in date and duration calculations. Time zone aware — all storage in UTC, all display in user's local time zone.

### Critical Path
- Calculated in real time as schedule changes
- Toggleable on Gantt (critical tasks in red)
- Float displayed in hours and minutes
- Float warning threshold configurable by PM
- Near-critical path (tasks within N days of becoming critical) in amber

### Network Diagram View
- Full dependency graph, all tasks as nodes
- Critical path highlighted
- Zoom, pan, click to open task detail
- Exportable as PNG or PDF

### Multiple Timeline View
- Stack multiple timelines on one screen (cross-project or cross-phase)
- Executive view: all active projects in one stacked timeline

### Task Splitting
- A task can be split into non-contiguous segments on the timeline
- Split points visible on Gantt

### Progress Lines
- Vertical line on Gantt showing where the project should be today
- Tasks left of the line and not complete = behind schedule

### Baselines
- Baseline 1 set at project approval — permanent, never overwritten
- Up to 10 additional baselines saved at any point
- Gantt shows current vs. selected baseline as overlapping bars
- Variance column: days ahead or behind with trend arrow
- Baseline comparison report: one click, exportable

---

## 7. Date and Time Precision

**Every date field in Planix carries a time, not just a date.**

- All datetimes stored as UTC `timestamptz` in PostgreSQL
- Displayed in the user's configured time zone
- Combined date-time picker for all date fields
- Default time when only a date is selected: 5:00 PM (configurable at org level)
- "All day" toggle suppresses the time display without losing UTC storage

### Gantt Zoom Levels
Year → Quarter → Month → Week → Day → Hour

Hour zoom shows task bars rendered at precise start/end times with working hours shading.

### Time-Specific Constraints
Constraint types accept a specific time: "Must Finish On June 28 at 11:00 PM" — critical for IT maintenance windows and construction shift deadlines.

### Float in Hours and Minutes
At the hour zoom level: "This task has 3 hours 20 minutes of float" is more useful than "0 days of float."

### Time-Aware Notifications
Notifications fire based on datetime, not date. "Task due in 2 hours" fires at the correct local time for each recipient's time zone.

---

## 8. Change Impact System

### The Change Dialog (fires before any schedule change saves)
1. **Impact preview:** all downstream tasks affected with new dates, net project completion impact, resource conflicts, constraint violations, critical path impact, SLA impact
2. **User decision:** cascade all / update manually / show compression options / cancel
3. **Required reason:** dropdown category + optional free text. Cannot save without this.

### Change Reason Categories
- Scope change
- Resource unavailability
- External dependency delayed
- Risk materialized
- Early completion (positive)
- Client or stakeholder request
- Technical blocker
- Estimate was wrong
- Other (free text required)

### Early Finish Prompt
When a task completes before its planned finish, Planix asks: "Task 4 finished 2 days early. Want to pull forward the dependent tasks? This would move project completion from July 22 to July 19."

Options: pull all forward / keep original dates / choose which to move

### Change Audit Log (immutable)
Every change creates a permanent, uneditable audit entry:
- What changed (field, old value, new value)
- Who changed it
- When (UTC timestamp to the minute)
- Why (the reason entered)
- Downstream tasks affected
- Direction: positive (green) or negative (red)
- Baseline variance at time of change

No user, including admins, can edit or delete audit records.

---

## 9. Schedule Rollback System

**Restore points** are separate from baselines.
- A baseline = intentional PM-set snapshot
- A restore point = automatic snapshot every time the schedule changes

### Restore Points
- Created automatically on every schedule change
- Manual named restore points saved by PM at any time
- Named restore points kept indefinitely
- Automatic restore points retained 90 days (configurable by admin)
- Stored as compressed diffs, not full copies

### Performing a Rollback
1. PM opens Schedule History
2. Selects restore point, sees side-by-side preview (restore point vs. current)
3. PM clicks Restore, enters required reason
4. Planix executes rollback, creates a new restore point of the pre-rollback state
5. Audit log records the rollback
6. All team members notified via all active project notification channels

### What Rollback Affects / Does Not Affect
**Affected:** task dates, durations, assignments, statuses, dependencies, custom field values, pending reminder schedules (recalculated against restored dates)
**Not affected:** task comments, messages, file attachments, baselines, audit log, time log entries, PMI form content, restore point history

---

## 10. In-App Messaging and Communication

### Message Types
- Project broadcast (PM to entire project team)
- Direct message (any user to any user)
- Task-anchored message (tied to specific task, visible in task thread)
- Department announcement (Dept Head to all department members)
- Milestone alert (auto-generated on milestone hit or miss)
- SLA alert (automated when SLA is at risk)
- Customer notification (outbound to customer portal at configurable milestones)

### Features
- Rich text formatting, @mentions
- Attach files, tasks, artifacts, or map locations to a message
- Threaded replies
- Read receipts (PM sees who viewed and when)
- Pin important messages to the project
- Message history is permanent, searchable, visible to new team members
- Urgent flag bypasses quiet hours

---

## 11. Notification Engine

### Three Notification Channels (PM-Controlled)
| Channel | Always On? | Who Controls |
|---|---|---|
| In-App | Yes — cannot be disabled | System |
| Email | PM toggles per project | PM |
| Teams DM | PM toggles per project | PM |
| Teams Channel | PM selects the channel | PM |

**Users cannot override the PM's channel configuration.** If a team member claims they missed a notification, the delivery log shows exactly what happened.

### Teams Integration (Graph API Delegated Permissions)
One-time admin setup: register Planix Teams bot in CHR tenant.

Required Graph API permissions (all delegated):
- `Team.ReadBasic.All` — list Teams the user belongs to
- `Channel.ReadBasic.All` — list channels in each Team
- `ChannelMessage.Send` — post to a Teams channel
- `Chat.Create` — create a DM chat
- `ChatMessage.Send` — send a DM via the bot
- `User.Read` — read the authenticated user's profile
- `User.ReadBasic.All` — look up other users' Teams identities

PM channel selection: `GET /me/joinedTeams` → user selects Team → `GET /teams/{teamId}/channels` → user selects channel. Stored as channel ID + team ID on the project.

Project-wide events post to the Teams channel. Personal notifications (task reminders, overdue, direct messages) go as Teams DMs to the individual.

If a user has no resolvable Teams account: fallback to email, flagged in project roster.

### Proportional Reminder Profiles
| Profile | Task Duration | Reminder Schedule |
|---|---|---|
| Same Day | Under 4 hours | 1 hour before |
| Short | 4 hours to 1 day | 4 hours before, 1 hour before |
| Standard | 2–7 days | 2 days out, 1 day out, 2 hours before |
| Extended | 8–30 days | 1 week out, 3 days out, 1 day out, 2 hours before |
| Long-Range | 31+ days | 30 days out, 2 weeks, 1 week, 3 days, 1 day, 2 hours before |
| Custom | Any | PM defines intervals |

Reminder timing calculated in working minutes against the project calendar — never wall clock time.

### Escalating Overdue Cadence
| Threshold | Behavior | Recipients |
|---|---|---|
| Task passes due datetime | Immediate alert | Assignee(s) |
| 1 day overdue | Daily reminder | Assignee(s) |
| 3 days overdue | Every 12 hours | Assignee(s) + PM |
| 7 days overdue | Daily | Assignee(s) + PM + Dept Head |
| 14 days overdue | Daily | Above + Executive (optional) |

All thresholds and recipients configurable by PM per project.

---

## 12. CHR Business Unit Requirements

### 12.1 Fiber Engineering and Construction

**Location and Geography (Mapbox)**
- Every project and task can have a physical location
- Map view: tasks plotted geographically, color-coded by status
- Route drawing: define fiber route or work zone on the map
- GPS-aware mobile task list: tasks sorted by proximity to current location
- Photo thumbnails on map pins

**Field Crew Mobile**
- Camera capture: attach photos from phone camera directly to task
- Mark task complete with single tap
- Log notes by voice or text
- Offline mode: task list and photos available without cell signal, sync on reconnect
- Conflict resolution on sync: side-by-side comparison, user chooses winner, both photos kept

**External Dependency Tracking**
- Dependency type: External (permit, utility locate, ROW, weather, inspector)
- External dependencies have an owner, status, and expected resolution datetime
- External dependency log view across all construction projects

**Field Sign-Off Workflows**
- Tasks can require formal sign-off before marked complete
- Sign-off request sent via in-app message
- Digital signature captured with timestamp
- Task cannot advance until sign-off complete

**Construction PMI Forms**
Permit Log, Right-of-Way Tracker, As-Built Documentation Checklist, Inspection Sign-Off Form, Punch List, Safety Checklist, Material Delivery Log

### 12.2 Software Development and Customer Activations

**Azure DevOps Integration** — See Section 5. Phase 1, not Phase 2.

**Customer Activation Projects**
- Activation template: every standard step in minutes with correct dependencies
- SLA field on projects with breach alerting
- Customer notification at defined activation milestones
- Activation dashboard: all active activations, RAG status, SLA health, days to go-live

### 12.3 Managed IT Services and Cybersecurity

**Ticket-to-Project Escalation (Freshservice)**
- Escalate a ticket to a Planix project with context preserved
- Ticket ID links back to originating Freshservice ticket
- Status updates in Planix optionally update the ticket

**CAB Workflow**
- Change request form: systems affected, risk assessment, rollback plan, maintenance window
- Sequential CAB approval chain: Tech Lead → Security → Change Manager → optionally client
- CAB meeting agenda auto-generated from pending change requests
- Emergency change fast track for critical incidents

**Confidential Project Flag**
- Confidential projects do not appear in department dashboards for general members
- Visibility explicitly granted to named individuals only
- Every access to a confidential project logged in audit trail

**On-Call Awareness**
- On-call periods reduce resource availability in the workload view
- Warning when scheduling a task during a resource's on-call period

**Recurring Maintenance Projects**
- Templates can recur on a schedule (monthly, quarterly, annually)
- Auto-generated project at configured interval with PM review gate

**SLA Tracking**
- SLA fields on projects and tasks with countdown visible on task cards
- Breach alerts at 50%, 75%, 90% of SLA time consumed

---

## 13. Resource Management and EVM

### Resource Types
- Work resources (people, tracked in minutes)
- Material resources (physical items consumed)
- Cost resources (fixed costs attached to tasks)

### Workload View
- Visual capacity chart: over-allocated (red), normal (teal), under-used (gray)
- Drag-and-drop task reassignment from workload view
- Dual-level grouping (department and project simultaneously)
- On-call periods shown as reduced availability blocks

### Earned Value Management (Full Suite)
| Metric | Formula |
|---|---|
| Planned Value (PV) | % complete planned × budget |
| Earned Value (EV) | % complete actual × budget |
| Actual Cost (AC) | Sum of actual costs to date |
| Schedule Variance (SV) | EV - PV |
| Cost Variance (CV) | EV - AC |
| SPI | EV / PV |
| CPI | EV / AC |
| EAC | BAC / CPI |
| VAC | BAC - EAC |
| TCPI | (BAC-EV) / (BAC-AC) |

---

## 14. Customer and Stakeholder Portals

### Customer Login Portal
- Customer account created by CHR admin (not self-registered)
- Customer sees only their projects
- PM controls what each customer sees within their project
- Multiple projects per customer (ongoing managed services)
- Customer can submit new project requests or service requests
- Request tracking visible to customer in the portal

### External Stakeholder Link (No Account)
- PM generates a secure link for a specific view
- Optional password protection and expiration date
- PM controls exactly what is visible
- Access log: PM sees how many times opened and when

### White-Label Branding Profile (per Customer)
Each customer record stores:
- Customer display name (used in report headers, portal title, email subjects)
- Customer logo (PNG or SVG, max 2 MB, min 200px wide, max display height 48px)
- Brand accent color (hex, must pass WCAG AA 4.5:1 contrast against white, validated at entry)
- Report footer text (default: "Prepared by CHR Solutions for [Customer Name]")
- Portal label (default: "[Customer Name] Project Portal")
- PDF filename prefix

**The Planix product name must never appear in any customer-facing output.**

What gets white-labeled: all generated PDFs, the customer portal, portal notification emails, stakeholder share links.
What does NOT get white-labeled: the internal CHR Planix interface, internal reports, team notifications.

Status colors on reports are never overridden by brand color. Green/amber/red health indicators are sacred.

### Customer Portal Update Gating
- Portal is a PM-gated published snapshot by default (not a live feed)
- PM reviews changes, writes optional context note, then publishes
- Live Mode available as opt-in per customer for full transparency
- Customer notification emails sent on publish or (in Live Mode) on significant changes

---

## 15. PMI-Aligned Form Library

No major PM platform ships this natively. It is a genuine first-mover advantage.

Forms are always optional. Teams who want PMI structure get it. Teams who do not want it never see it.

### Standard PMI Forms (19)
Project Charter, Scope Statement, Stakeholder Register, RACI Matrix, Risk Register, Issue Log, Change Request Form, Change Log (auto-populated from audit trail), Assumption Log, Action Item Log (action items convertible to tasks), Communication Plan, Lessons Learned Register, Quality Management Plan, Procurement Log, Meeting Minutes (action items convertible to tasks), Status Report, WBS Template, Project Closure Report, Benefits Realization Tracker, Sprint Retrospective

### Construction Forms (7)
Permit Log, Right-of-Way Tracker, As-Built Documentation Checklist, Inspection Sign-Off Form, Punch List, Safety Checklist, Material Delivery Log

### IT/Security Forms (6)
CAB Change Request Form, CAB Meeting Agenda (auto-generated), Incident Retrospective, Security Assessment Checklist, DR Test Report, Runbook Template

All forms: fillable in Planix, exportable to PDF and Word, version history, linked to relevant project objects.

---

## 16. Department Project Templates

Every department runs the same types of projects repeatedly. Templates fix that.

### Template Contents
- Project name pattern, pre-built phases, standard task list with durations in minutes
- Default dependencies, default assignee roles (not specific people)
- Custom fields, pre-attached PMI forms, communication plan defaults
- Standard milestones, budget template structure, tags
- ADO defaults (for dev templates), map configuration (for construction templates)

### Template Management
- Any PM can save a project as a template
- Dept Head approval before department-wide availability
- Access levels: Private / Department / Org-wide
- Version history preserved
- Usage statistics: times used, avg actual vs. estimated duration

### Template Learning Loop
After a project closes, Planix analyzes actual vs. estimated durations across the last N uses and prompts: "Task 3 took 40% longer than the template estimate across the last 4 projects. Want to update the template?"

---

## 17. Project Import Engine

### Microsoft Project Import
- Formats: `.mpp` (via MPXJ library, LGPL) and `.xml` (preferred)
- Preserves: all task fields, dependencies with types and lag, baselines, calendars, all 8 constraint types, resource rates, custom fields, WBS hierarchy
- Resource matching: PM matches MS Project resource names to Planix users
- Runs as background job with progress indicator for large files
- Import lands in Draft state for PM review before publishing
- 30-day import rollback window

### Wrike Import
- **Path 1 (preferred):** Wrike REST API via OAuth — full fidelity including hierarchy, dependencies, custom fields, attachments, comments
- **Path 2 (fallback):** Wrike CSV export — partial fidelity (no comments, attachments, or dependency types)
- Status mapping, resource matching, and custom field mapping reviewed by PM before committing
- Same Draft state and 30-day rollback window as MS Project

### Pre-Import Validation Report
Before any import commits: task summary, successfully mapped fields, approximated fields, unsupported fields (formula fields imported as static values and flagged), unmatched resources, dependency warnings, date warnings, custom field mapping review.

### Future Import Formats (Phase 6)
ClickUp, Asana, Monday.com, Jira, Trello, Smartsheet, generic Excel/CSV template

---

## 18. Reporting and Dashboards

### Project-Level Reports
Schedule variance, change impact summary, resource utilization, budget vs. actual, EVM dashboard, risk summary, task completion, milestone tracking, sprint velocity and burndown, SLA performance, change audit log export

### Department-Level Dashboard
All projects RAG status, resource utilization across all dept projects, budget rollup, milestone calendar, risk summary, SLA health

### Executive Portfolio View
Every active project: name, department, PM, % complete, RAG, days to completion. Milestone heat map. Budget health. No task-level detail.

### Report Delivery
Manual PDF/Word/Excel, scheduled auto-delivery, status report requiring PM approval before sending, customer portal auto-update

---

## 19. Resilience and Edge Cases

### Authentication
- Internal CHR: Azure AD SSO, session terminates within 15 min of AD account deactivation
- Customer portal: email/password, forgot-password flow, lockout after 5 attempts
- Emergency fallback: PM can generate a one-time stakeholder link for a locked-out customer

### Offboarding Workflow (non-skippable)
When a user is deactivated: reassign project ownership → reassign open tasks → remove from approval chains → archive messages → convert time logs to read-only → confirm deactivation.

### Offline Conflict Resolution
Field crews working offline: conflict detected on sync, side-by-side resolution UI, user chooses winner per field, both photos kept if photo conflict.

### Timesheet Approval
Weekly submission → PM approval (Level 1) → Dept Head approval (Level 2) → Finance reporting. Delegate system for approvers on vacation. 48h/72h escalation thresholds.

### Soft Delete and Audit
Nothing hard-deleted immediately. 90-day recovery window for all objects. Full immutable audit trail covering every create, modify, delete, access event on significant objects.

### Auto-Save and Draft Recovery
Auto-save every 30 seconds. Browser local storage draft in real time. Server-side draft recovery on reconnect within 24 hours. Connectivity status indicator always visible.

### PM Coach
Contextual, skill-level-aware (Beginner / Developing / Experienced / Expert). Individual trigger toggles. Per-project coach override. Expert level has a short list of triggers only (critical path at zero float, SLA breach imminent, 20%+ over baseline, resource conflict on critical path, rollback by another user, timesheet escalation).

### System Status
Public status page at status.planix.chrsolutions.com. Database backups every 4 hours, 30-day retention. Point-in-time recovery to any 5-minute window. RTO: 4 hours. RPO: 4 hours max data loss. Uptime target: 99.9%.

### Performance Limits
- Soft limit: 2,000 tasks per project (warning to consider sub-projects)
- Hard limit: 5,000 tasks (scheduling engine performance not guaranteed beyond)
- Sub-project linking: master project shows summary Gantt bars for linked sub-projects
- File attachments: 100 MB per file, 10 GB per project (in Azure Blob Storage)

---

## 20. Phased Build Roadmap

| Phase | Focus | Key Deliverables |
|---|---|---|
| Phase 0 | Foundation | Multi-dept org model, auth/SSO, UTC datetime schema, i18n architecture, API layer, dark mode UI shell, CI/CD |
| Phase 1 | Core PM | Task management, Gantt, all dependency types, scheduling engine, baselines, critical path, network diagram, messaging, change impact dialog, ADO integration, date-time precision, MS Project .xml import |
| Phase 2 | Intelligence | PM Coach, PMI forms, sprint features, templates, map view, How-Do-I, Wrike import, .mpp import, customer portal with white-label branding |
| Phase 3 | Enterprise | Dept dashboards, EVM, portfolio view, full customer portal, budget tracking, Freshservice, CAB workflow, confidential projects, SLA tracking |
| Phase 4 | AI | Risk flagging, schedule health score, meeting-to-tasks, resource recommendation, compression AI, sprint planning AI |
| Phase 5 | Mobile | PWA optimization, iOS App Store, Android Play Store |
| Phase 6 | Ecosystem | Jira, GitHub, Esri/ArcGIS, open API, ClickUp/Asana import, custom domain for customer portal |

---

## 21. Open Questions

See `docs/OPEN_QUESTIONS.md` for the current decision log. Do not make assumptions on open items — flag them.

---

## 22. Custom Gantt Build Plan

No commercial Gantt library. The Gantt is a custom three-phase build.

### Rendering Architecture

Three synchronized layers:
1. **Task list panel (left):** React + react-virtual for virtualized row rendering
2. **Timeline (right):** HTML5 Canvas for bar rendering — never DOM per bar
3. **Dependency arrows:** SVG layer positioned over Canvas, updated on task change

### Time Axis Math

```
pixelsPerMinute = canvasWidth / (visibleEndMinutes - visibleStartMinutes)
barLeft = (taskStartMinutes - visibleStartMinutes) * pixelsPerMinute
barWidth = taskDurationMinutes * pixelsPerMinute
```

All calculations in working minutes against the project calendar.

### Phase 1 Gantt
Month and week zoom. Finish-to-Start dependencies. Drag-to-move. Baseline overlay. Critical path. Milestones. Progress lines. Phase summary bars.

### Phase 2 Gantt
All four dependency types. Day zoom. Drag-to-resize. Lead/lag display. Constraint indicators. Task splitting. Near-critical path (amber).

### Phase 3 Gantt
Hour zoom with time-of-day rendering. Working hours shading. Multi-page PDF (jsPDF). Network Diagram view (SVG). Multiple stacked timelines.

### Other Views (Not Affected — Standard React)
Kanban, Sprint Board, Backlog, Calendar, Timeline strip, Workload view, Mind Map, Map view — all standard React with dnd-kit for drag-and-drop.

---

## 23. Anthropic AI Insights Engine

### What It Does
On-demand AI analysis of live project data, accessible via a right-side drawer panel in every project view.

### Pre-Built Analyses
- Project Health Check
- Crash This Schedule (schedule compression options)
- Rebalance Resources (workload optimization)
- Draft Status Report
- Identify Hidden Risks
- Explain This Change (plain English summary of last schedule change)
- Sprint Planning Help (velocity-based commitment recommendation)
- EVM Interpretation
- Lessons Learned Synthesis (cross-project, dept-scoped)
- Custom free-text question

### Technical Approach
- **Server-side only.** API key never exposed to frontend.
- **Model:** claude-sonnet-4-6
- **Streaming:** Server-Sent Events from Node.js to browser
- **Context assembly:** ContextAssembler service formats project data into structured prompt. Never raw database records.
- **Max context:** 100,000 tokens. Large projects summarized if needed.
- **Conversation history:** maintained per session, browsable for 30 days
- **Rate limiting:** 20 requests per user per day (admin-configurable)
- **Admin dashboard:** monthly token usage and estimated cost

### System Prompt
"You are a senior project management advisor with access to live data from a project management application called Planix. Answer questions accurately based on the data provided. Do not invent data not in the context. Format responses with headings and bullet points where appropriate."

### Phase Availability
- Phase 1: AI Insights panel, Health Check, Status Report draft, custom questions, admin cost dashboard
- Phase 2: Crash schedule, rebalance resources, hidden risks, sprint planning
- Phase 3: EVM interpretation, lessons learned synthesis
