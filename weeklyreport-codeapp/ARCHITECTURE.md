# Architecture: Weekly Report Code App

A Power Apps Code App (React + TypeScript) for xPM-based project status reporting.
Project managers use it to create weekly work-phase reports from live Dataverse data.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [App Shell & Routing](#app-shell--routing)
4. [Pages](#pages)
5. [Components](#components)
6. [Data Layer](#data-layer)
7. [Data Model](#data-model)
8. [Hooks](#hooks)
9. [Internationalisation](#internationalisation)
10. [Styling](#styling)
11. [Build & Deploy](#build--deploy)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18, TypeScript |
| Styling | Tailwind CSS v3 (Audico Systems design system) |
| Data access | Power Apps SDK — generated Dataverse services (`src/generated/`) |
| Auth | Power Apps player proxy — no MSAL, no AAD registration needed |
| Build | Vite + `vite-plugin-singlefile` → single `index.html` bundle |
| Deployment | `pac` CLI via `npm run push` |

Local development runs through `npx power-apps run` (the SDK dev server), which proxies auth and Dataverse calls through the PA player.

---

## Project Structure

```
weeklyreport-codeapp/
├── src/
│   ├── App.tsx                     # Root component, view router
│   ├── main.tsx                    # ReactDOM entry point
│   ├── components/
│   │   ├── ChangesRisks.tsx        # ChangesTable + RisksTable
│   │   ├── InitiativeSelector.tsx  # Searchable project dropdown
│   │   ├── PMFields.tsx            # KPI status + situation comment
│   │   ├── ReportHeader.tsx        # Project info rows
│   │   ├── ScheduleGrid.tsx        # 3-week day-by-day schedule grid
│   │   ├── StaffingTable.tsx       # Weekly staffing (named resources)
│   │   └── TaskStatusTable.tsx     # Task completion + inline notes
│   ├── hooks/
│   │   └── useWeeklyReport.ts      # All data fetching for ReportEditor
│   ├── i18n/
│   │   └── translations.ts         # EN / FI / SV strings + t() helper
│   ├── pages/
│   │   ├── ReportEditor.tsx        # Edit/view a single report
│   │   └── ReportList.tsx          # Report list + project overview
│   ├── styles/
│   │   └── app.css                 # Tailwind directives + component classes
│   ├── types/
│   │   └── dataverse.ts            # All TypeScript interfaces
│   └── utils/
│       ├── dataverseClient.ts      # Typed wrappers over generated services
│       ├── staffingAggregator.ts   # Derives StaffingRow[] from tasks + assignments
│       └── weekUtils.ts            # ISO week maths, schedule helpers
├── generated/                      # Auto-generated — do not edit
│   ├── models/                     # Entity interfaces from pac
│   └── services/                   # Typed service classes (getAll, get, create, update)
├── power.config.json               # PA app ID, environment, registered tables
├── setup.md                        # Setup & deployment guide
└── ARCHITECTURE.md                 # This file
```

---

## App Shell & Routing

`App.tsx` is a minimal client-side router with no router library. Navigation state is held in a `view` discriminated union:

```ts
type View =
  | { type: "list" }
  | { type: "editor"; reportId: string; initiativeId: string };
```

On load, `App` checks `window.location.search` for `?reportId=...&initiativeId=...`. If both are present the app opens directly in editor view — useful for deep links from other PA screens.

```
App
├── view === "list"   → <ReportList onOpenReport={…} />
└── view === "editor" → <ReportEditor reportId initiativeId onBack powerAutomateFlowUrl />
```

`VITE_PA_FLOW_URL` (from `.env.local`) is forwarded to `ReportEditor` as `powerAutomateFlowUrl`. If empty, the "Generate PDF" button is hidden.

---

## Pages

### ReportList

Entry point for PMs. Lets a PM:

1. Pick a project/initiative via `InitiativeSelector`
2. See all existing status reports for that project (table)
3. Open an existing report for editing
4. Create a new report (auto-fills today's date)
5. Preview the Project Overview (tasks, assignments, changes, risks)

Data is fetched client-side on initiative selection via `Promise.allSettled` (partial failures show an error banner without blocking the rest of the UI).

### ReportEditor

The main editing surface. Contains a **sticky toolbar** (print:hidden) and the **printable report document**.

Toolbar actions:

| Action | Behaviour |
|---|---|
| Back | Returns to ReportList |
| Save | Calls `save()` from the hook, shows spinner |
| Language | Switches EN / FI / SV (local state, not persisted) |
| Print / Preview | `window.print()` |
| Generate PDF | POST to Power Automate flow; polls `aud_outputfileurl` on the report record |

The report is **read-only** when `report.statecode !== 0` (deactivated in Dataverse). Editable fields are limited to PM comment and KPI proposed values/notes — all other data comes read-only from xPM.

---

## Components

### InitiativeSelector

Debounced (300 ms) search over `pum_initiative` records. Closes on outside click. Once a project is selected it shows a locked state with a "Change" link.

### ReportHeader

Renders a two-column table of project metadata:
- Date, Project Number, Project (name), Client, Project Manager, Phase, Schedule Progress

All values come from `PumStatusReporting` and `PumInitiative`. Not editable in the report — updated in xPM.

### StaffingTable

Shows named resources whose assignments overlap the report week. Generic (role-based) resources are filtered out. Includes a "Total" footer row.

### ScheduleGrid

A 15-column (3 weeks × 5 days) task schedule. Each cell is filled if the task is active on that day. The report week column group is highlighted. Active cells use the Audico green accent with `print-color-adjust: exact`.

### PMFields

Two editable sections:
1. **Situation comment** — free-text textarea
2. **KPI table** — 6 dimensions (Summary, Resources, Quality, Cost, Scope, Schedule). Each row shows the current KPI from xPM (read-only) and a PM-editable proposed value + comment.

KPI values are Dataverse option set integers:

| Value | Meaning |
|---|---|
| 493840000 | ⚪ Not set |
| 493840001 | 🔴 Need help |
| 493840002 | 🟡 At risk |
| 493840003 | 🟢 No issue |

### ChangesRisks

Two sub-components shown only for **large projects** (`pum_projecttype === 493840002`):

- **ChangesTable** — Change requests with colour-coded status badges (Open / Approved / Rejected / Pending)
- **RisksTable** — Active risks with 1–5 impact scale and 10–90% probability

### TaskStatusTable

Task completion table with inline note editing. Click a note cell to edit; `Enter` commits, `Esc` cancels. Notes are saved to `aud_weeklyreporttasknote` on commit (upsert via `onNoteChange` callback).

---

## Data Layer

### Generated services (`src/generated/`)

Each Dataverse table registered via `pac code add-data-source` gets a typed service class:

```ts
Pum_initiativesService.getAll({ filter, select, orderBy, top })
Pum_initiativesService.get(id)
Pum_statusreportingsService.create(data)
Pum_statusreportingsService.update(id, data)
// etc.
```

Auth is handled entirely by the Power Apps player proxy. The services do not accept tokens — they are only usable inside the PA runtime (or the SDK dev server).

### dataverseClient.ts

Thin typed wrappers that translate between the generated service API and the app's own interfaces. Callers import from here, not from `generated/` directly.

Key functions:

| Function | What it does |
|---|---|
| `fetchInitiatives(search?)` | Top-100 initiatives filtered by name |
| `fetchInitiativeWithType(id)` | Single initiative including project type & owner name |
| `fetchGanttTasksWithStaffing(id, start, end)` | Tasks overlapping the report week |
| `fetchAllGanttTasks(id, start, end)` | Tasks for the 3-week schedule grid |
| `fetchAssignmentsWithRoles(id)` | Assignments with resource type & role name |
| `fetchAssignmentsForInitiative(id)` | Flat assignment rows (planned/actual hours) |
| `fetchChangeRequests(id)` | Change requests sorted by creation date |
| `fetchRisks(id)` | Active risks sorted by impact |
| `fetchStatusReports(id)` | All reports for an initiative, newest first |
| `fetchStatusReport(id)` | Single report |
| `createStatusReport(data)` | Create new `pum_statusreporting` record |
| `updateStatusReport(id, data)` | Patch editable fields (PM comment, KPI) |

Multi-entity cases (tasks + assignments for the schedule grid) use `Promise.all` with two separate service calls and a client-side join.

---

## Data Model

```
pum_initiative (xPM project)
│
├── pum_statusreporting (1:N) ── PM status report per week
│   └── editable fields: pum_comment, pum_kpinew*, pum_kpinew*comment
│
├── pum_gantttask (1:N) ── Schedule tasks
│   └── pum_assignment (1:N)
│       └── pum_resource → pum_role
│
├── pum_changerequest (1:N) ── Change requests
│
└── pum_risk (1:N) ── Risk register

aud_weeklyreport (Audico) ── Linked to pum_initiative
└── aud_weeklyreporttasknote (1:N) ── Per-task PM notes
    └── linked to pum_gantttask
```

The app writes only to:
- `pum_statusreporting` — KPI proposed values + PM comment
- `aud_weeklyreport` — Weekly report record (week number, status, action items)
- `aud_weeklyreporttasknote` — Per-task notes (upserted on edit)

Everything else is read-only from xPM.

---

## Hooks

### useWeeklyReport(reportId, initiativeId)

Orchestrates all data fetching and state for `ReportEditor`.

**Fetch sequence:**

1. `fetchStatusReport(reportId)` + `fetchInitiativeWithType(initiativeId)`
2. Derive `weekNumber` / `year` from `report.pum_statusdate`
3. Build `scheduleColumns` (weeks N−1, N, N+1)
4. Parallel fetch (all start together):
   - `fetchGanttTasksWithStaffing` → staffing aggregation
   - `fetchAllGanttTasks` → schedule cells
   - `fetchAssignmentsWithRoles` → `StaffingRow[]`
   - `fetchChangeRequests` (large projects only)
   - `fetchRisks` (large projects only)

**Save behaviour:**

`save()` calls `updateStatusReport` with only the PM-editable fields (comment + 12 KPI fields). Dirty tracking prevents saving unchanged reports. The hook is optimistic — UI updates immediately, errors surface as a banner.

---

## Internationalisation

```ts
import { t } from "../i18n/translations";

t("reportTitle", lang)           // "WORK PHASE REPORT" / "TYÖVAIHEILMOITUS" / "ARBETSFASRAPPORT"
t("wk", lang, 10)                // "Wk 10" / "Vko 10" / "V. 10"  (with argument)
```

Supported languages: **English** (`en`), **Finnish** (`fi`), **Swedish** (`sv`).

Language selection is local UI state in `ReportEditor` — not persisted. Default is `fi`.

---

## Styling

Tailwind CSS v3 with the **Audico Systems** design system (green accent `#188c5b`).

CSS custom properties in `app.css`:

```css
--audico-accent:        #188c5b
--audico-accent-hover:  #147a4f
--audico-accent-active: #106843
--audico-accent-subtle: rgba(24,140,91,0.08)
```

Shared component classes (`@layer components` in `app.css`):

| Class | Used for |
|---|---|
| `report-table` | Full-bordered compact data tables |
| `section-title` | Uppercase grey headings with bottom border |
| `section-subtitle` | Sub-section headings |
| `schedule-cell-active` | Green schedule cells (print-color-adjust: exact) |
| `badge-done` / `badge-mid` / `badge-low` | Task completion badges |
| `notes-display` | Clickable inline note cell |

Print styles preserve the report layout and force colour printing of schedule cells.

---

## Build & Deploy

```bash
# Local dev (requires Power Apps SDK auth)
npm run dev           # → npx power-apps run

# Deploy to dev environment
npm run push          # → npm run build && npx power-apps push

# Type-check only
npm run typecheck
```

`vite-plugin-singlefile` bundles all JS and CSS into a single `index.html`. External assets (fonts, images) must either be loaded from a trusted CDN or embedded as data URIs — the PA player isolates the app and cannot resolve relative file paths to the host filesystem.

The logo is currently loaded from a CDN URL (`audicoLogo` constant in `ReportList.tsx` and `ReportEditor.tsx`). If the CDN is inaccessible from the PA player, the alternative is to upload the logo as a Dataverse Web Resource and reference its `/WebResources/` path.
