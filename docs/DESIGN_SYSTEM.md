# Planix Design System

**Version:** 1.1
**Status:** Approved. Do not deviate without VP sign-off.

---

## Philosophy

Planix is a professional tool used under deadline pressure. The UI has one job: get out of the way and let people work. Every design decision is evaluated against that standard.

**Dark mode is the default.** The entire shell uses a unified dark surface family. The sidebar background matches the content background — they are the same color family with only a 1px border separating them. Do not introduce a contrasting sidebar color.

---

## Color Tokens

All colors are CSS custom properties. No hardcoded hex values in component code. Ever. This is what makes dark/light mode work.

### Background Layers

```css
:root {
  --px-bg-base: #0D1625;        /* outermost page background */
  --px-bg-shell: #111929;       /* sidebar + top bar (unified chrome) */
  --px-bg-surface: #141E30;     /* cards, panels, content containers */
  --px-bg-elevated: #1A2640;    /* hover states, metric cards, dropdowns */
  --px-bg-overlay: #222F4A;     /* modals, popovers, tooltips */
}

[data-theme="light"] {
  --px-bg-base: #F0F2F5;
  --px-bg-shell: #F8FAFB;
  --px-bg-surface: #FFFFFF;
  --px-bg-elevated: #F4F6F8;
  --px-bg-overlay: #EEF0F4;
}
```

### Brand and Accent

```css
:root {
  --px-teal-500: #00BCD4;       /* primary interactive accent */
  --px-teal-300: #4DD6E8;       /* hover state */
  --px-teal-700: #0097A7;       /* active/pressed state */
  --px-teal-900-bg: #003540;    /* teal background tint (active nav, info cards) */
  --px-gold-500: #F9A825;       /* warning accent, PM Coach indicator */
  --px-gold-900-bg: #2D2000;    /* gold background tint */
}
```

### Status Colors — SACRED. Never override with brand colors.

```css
:root {
  --px-green-500: #4CAF50;      /* on track / complete */
  --px-amber-500: #FFC107;      /* at risk / warning */
  --px-red-500: #F44336;        /* overdue / critical */
  --px-gray-500: #546E7A;       /* not started */
  --px-orange-500: #FF7043;     /* blocked */
  /* in progress uses --px-teal-500 */
  --px-purple-500: #7E57C2;     /* on hold */
}
```

### Text Colors

```css
:root {
  --px-text-primary: #E8EDF5;
  --px-text-secondary: #8A9BB5;
  --px-text-tertiary: #556175;
  --px-text-inverse: #0D1625;   /* text on colored backgrounds */
  --px-text-accent: #00BCD4;    /* links, interactive labels */
}

[data-theme="light"] {
  --px-text-primary: #1A2640;
  --px-text-secondary: #4A5568;
  --px-text-tertiary: #718096;
  --px-text-inverse: #FFFFFF;
  --px-text-accent: #0097A7;
}
```

### Borders

```css
:root {
  --px-border-subtle: rgba(255, 255, 255, 0.06);
  --px-border-default: rgba(255, 255, 255, 0.12);
  --px-border-strong: rgba(255, 255, 255, 0.24);
  --px-border-accent: #00BCD4;
}

[data-theme="light"] {
  --px-border-subtle: rgba(0, 0, 0, 0.06);
  --px-border-default: rgba(0, 0, 0, 0.12);
  --px-border-strong: rgba(0, 0, 0, 0.24);
  --px-border-accent: #0097A7;
}
```

### How to Apply Dark/Light Mode

Set `data-theme` attribute on the `<html>` element. JavaScript toggles this on the mode switch button. No page reload. No flash.

```javascript
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
```

On first visit before a preference is saved, read `prefers-color-scheme` and apply it.

---

## Typography

**Font stack:** Inter (variable, from Google Fonts) for UI. JetBrains Mono for data/code.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
:root {
  --px-font-ui: 'Inter', system-ui, -apple-system, sans-serif;
  --px-font-mono: 'JetBrains Mono', Menlo, Consolas, monospace;
}
```

### Type Scale

| Role | Size | Weight | Used For |
|---|---|---|---|
| Display | 32px | 500 | Hero metrics on exec dashboard only |
| Heading 1 | 22px | 500 | Page titles, modal titles |
| Heading 2 | 18px | 500 | Card section headers, panel titles |
| Heading 3 | 15px | 500 | Sub-section labels, table column headers |
| Body | 14px | 400 | Task descriptions, comments |
| Label | 13px | 500 | Form labels, nav items, badge text |
| Caption | 12px | 400 | Timestamps, metadata, helper text |
| Micro | 11px | 400 | Tooltips, density mode. **Never smaller.** |
| Mono Data | 13px | 400 | Durations, IDs, numeric data |

**11px is the absolute minimum. No exceptions.**

### Numeric Display Rules
- Task durations: `2h 30m` or `45m` — never `2.5h`, never raw minutes
- Currency: `$1,234.56` with thousands separator
- Percentages: whole numbers unless precision required (`78%` not `78.3%`)
- Dates: `Jun 30, 2026` or `Jun 30, 2026 at 3:00 PM CT` when time matters
- Variance: signed with color (`+3 days` green, `-2 days` red)

---

## Layout Architecture

### Shell Structure

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR  (52px, --px-bg-shell)                         │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  SIDEBAR   │  CONTENT ZONE                              │
│  (220px)   │  (remaining width, scrollable)             │
│  --px-bg   │  --px-bg-base                              │
│  -shell    │                                            │
│            │  Cards: --px-bg-surface                    │
│            │                                            │
└────────────┴────────────────────────────────────────────┘
```

**The sidebar and top bar share `--px-bg-shell`.** They read as unified chrome, not separate elements. The only visual separator between sidebar and content zone is `border-right: 1px solid var(--px-border-subtle)` on the sidebar. No shadow. No gradient. No color contrast.

### Content Grid
- 12-column grid, 24px gutters
- Project dashboard: 8-col main, 4-col right panel
- Cards snap to column multiples (3, 4, 6, 8, 12)

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Desktop XL | 1440px+ | Full layout, sidebar 220px |
| Desktop | 1280–1439px | Full layout |
| Desktop S | 1024–1279px | Sidebar collapses to 48px icon-only |
| Tablet | 768–1023px | Sidebar behind hamburger, single column |
| Mobile | < 768px | Simplified view: tasks, overdue, messages |

---

## Components

### Buttons

| Variant | Background | Border | Text | Use |
|---|---|---|---|---|
| Primary | `--px-teal-500` | None | `--px-text-inverse` | One per view max |
| Secondary | Transparent | `--px-border-default` | `--px-text-primary` | Supporting actions |
| Destructive | Transparent | `--px-red-500` | `--px-red-500` | Delete, rollback |
| Ghost | Transparent | None | `--px-text-secondary` | Dense area actions |
| Disabled | `--px-bg-elevated` | None | `--px-text-tertiary` | Not available |

Height: 36px standard, 28px compact. Focus ring: `2px solid var(--px-teal-500)` with 2px offset.

### Form Fields
All fields: 36px height, `border: 1px solid var(--px-border-default)`, `background: var(--px-bg-elevated)`.
Focus: `border-color: var(--px-border-accent)`.
Error: `border-color: var(--px-red-500)` + red helper text below.

### Cards

| Type | Background | Border | Use |
|---|---|---|---|
| Surface card | `--px-bg-surface` | `--px-border-subtle` 1px | Primary content containers |
| Elevated card | `--px-bg-elevated` | `--px-border-default` 1px | Modals, selected states |
| Status card | `--px-bg-surface` | 3px left border in status color | PMI forms, risk items |
| Metric card | `--px-bg-elevated` | None | Summary numbers |
| Callout card | `--px-teal-900-bg` | None | Coach messages, alerts |

### Status Badges
- 20px tall, 4px border radius, 6px horizontal padding
- 11px font, weight 500, lowercase
- Background: status color at 15% opacity
- Text: status color at full opacity
- Never pure white text on colored badge background

### Progress Indicators

| Type | Spec |
|---|---|
| Circular donut | 68px diameter, 7px stroke, track: `--px-bg-elevated`, arc: status color, label inside 13px mono |
| Linear bar | 5px height, track: `--px-bg-elevated`, no border radius on bar ends |
| Gantt bar | 12px standard zoom, 8px compact. Baseline bar in `rgba(255,255,255,0.12)` behind current bar |
| Burndown | Ideal: `--px-border-default` dashed. Actual: `--px-teal-500` solid |

### Navigation

**Active nav item:** `border-left: 3px solid var(--px-teal-500)` + `background: var(--px-teal-900-bg)` + `color: var(--px-teal-300)`.
**Inactive:** `color: var(--px-text-tertiary)`.
**Hover:** `background: rgba(255,255,255,0.04)` + `color: var(--px-text-primary)`.
**Section labels:** 10px, weight 500, `color: var(--px-text-tertiary)`, uppercase, 0.08em letter-spacing.

---

## Dark/Light Mode Toggle

- Location: right side of top bar, left of notification bell
- Icon: sun when in dark mode (click to switch to light), moon when in light mode
- Transition: 150ms ease on `background-color` and `color` only. No layout shift.
- `prefers-reduced-motion`: all transitions reduce to 0ms

---

## Motion

| Interaction | Duration | Easing |
|---|---|---|
| Mode toggle | 150ms | ease |
| Card hover | 100ms | ease-out |
| Dropdown open | 150ms | ease-out |
| Modal open | 200ms | ease-out |
| Toast (in/out) | 200ms / 150ms | ease-out / ease-in |
| Gantt drag | 0ms during / 100ms on drop | — / ease |

**Respect `prefers-reduced-motion`.** All transitions reduce to 0ms. Apply globally.

---

## Accessibility (WCAG 2.1 AA — Required, Not Aspirational)

| Requirement | Standard | Rule |
|---|---|---|
| Normal text contrast | 4.5:1 | All body and label text in both modes |
| Large text contrast | 3:1 | Headings 18px+ and bold 14px+ |
| UI component contrast | 3:1 | Button borders, inputs, focus rings |
| Keyboard navigation | Full | Every interactive element reachable by Tab |
| Focus indicators | Always visible | 2px solid `--px-teal-500`, 2px offset. Never `outline: none` without replacement. |
| Screen reader | Semantic HTML | Correct heading hierarchy, ARIA labels on icon-only buttons |
| Status not color-only | WCAG 1.4.1 | Every status = color PLUS label or icon |
| Text resize | 200% | No horizontal scrollbars at 1280px |
| Touch targets | 44x44px min | All tappable elements |

Every PR touching the frontend must pass these checks before merge.

---

## White-Label Report Layout

When generating a PDF report for a customer, the following structure applies.

**Page Header:** Customer logo left-aligned (max 48px height, maintain aspect ratio). Report title centered. Generation date right-aligned. Background: customer brand accent color (or `--px-teal-500` if not set). Text: white.

**Page Footer:** Left: customized footer text (default: "Prepared by CHR Solutions for [Customer Name]"). Center: page number of total. Right: chrsolutions.com.

**Section Headers:** Customer brand accent color background, white text.

**Data Tables:** Brand accent color header row, white text. Alternating light gray and white rows. Print-safe colors.

**Status Badges:** Status colors unchanged. Never overridden by brand color.

**Brand Accent Color Rule:** Must pass WCAG AA 4.5:1 against white. Validated at entry. Falls back to CHR teal if not set or if contrast fails.

**The Planix product name must never appear in any customer-facing output.**

---

## Implementation Rules for Developers

1. All color tokens in a single `tokens.css` file. `[data-theme="light"]` override block in the same file.
2. Component styles in CSS Modules. No global class collisions.
3. No inline styles except for JS-calculated dynamic values (e.g., Gantt bar width).
4. No `!important` except in the `prefers-reduced-motion` override block.
5. Every component built mobile-first. Desktop enhancements via `min-width` media queries.
6. Every component tested in both modes before considered done.
7. Every interactive component keyboard-navigable before considered done.
8. Chart.js: hardcoded hex values (cannot use CSS variables). Re-render on theme change event.
9. Gantt library: configured with custom Planix theme object. Built-in themes not loaded.
10. Sidebar right border: `1px solid var(--px-border-subtle)`. The sole visual separator.
