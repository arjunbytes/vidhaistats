# Vidhai Application Tracker

A Next.js 14 application for **Agaram Foundation** to track the **Day to Day Vidhai Application Status** through every pipeline stage — from letter reading to final interview — broken down by 8 beneficiary categories.

Built with the same **HeroUI + Fluent UI** look and feel used in the CSR Management app.

---

## Features

- **Daily Entry** — interactive table that mirrors your spreadsheet exactly: 9 stages, sub-stages (HV / WL / R, Select / Hold / Reject), and 8 categories. Live totals as you type. Save and reload by date.
- **History Log** — every saved day, newest first, with key metrics at a glance and one-click Open to edit.
- **Dashboard** — trend area chart, pipeline funnel, category composition donut, and Review vs Final selection outcomes stacked bars.
- **Overview / Home** — KPI cards and the most recent entry.
- **Local persistence** — entries are stored in `data/entries.json` (no database required to start).
- **JSON export** — download the full log for offline use or for feeding Looker / Power BI.

---

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + **HeroUI** for the design system
- **Fluent UI Icons** (`@fluentui/react-icons`) — matches your CSR Management aesthetic
- **Recharts** for the dashboard visualisations
- **Framer Motion** (already wired by HeroUI) for transitions

---

## Folder Structure

```
vidhai-tracker/
├── app/
│   ├── api/
│   │   └── entries/
│   │       ├── route.ts              # GET list, POST upsert
│   │       └── [date]/route.ts       # GET by date, DELETE
│   ├── dashboard/page.tsx
│   ├── entry/page.tsx
│   ├── history/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                      # Home / Overview
│   └── providers.tsx                 # HeroUIProvider
├── components/
│   ├── DashboardCharts.tsx
│   ├── EntryClient.tsx               # The big editable table
│   ├── Sidebar.tsx
│   └── TopBar.tsx
├── lib/
│   ├── schema.ts                     # Stages, categories, types, helpers
│   └── store.ts                      # JSON-file persistence
├── data/
│   └── entries.json                  # Your saved entries live here
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Getting Started

### 1. Install dependencies

```bash
cd vidhai-tracker
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 3. Build for production

```bash
npm run build
npm run start
```

---

## Daily Workflow

1. Open the app → **Daily Entry** (or click "Enter Today's Data" on the home page).
2. The date defaults to today. Change it if you're back-filling.
3. Type counts into each cell. Use **Tab** to move across, **Enter** to drop down.
4. Click **Save Entry**. The entry now appears in the History Log and the Dashboard updates immediately.
5. Visit **Dashboard** any time to see trend, funnel, composition and outcome charts.

---

## Where the data lives

By default the app persists entries to `data/entries.json`. This works on any single-server / single-instance deployment (e.g. a small VM, your laptop, Railway, Render, Fly.io).

If you want a real database later, swap `lib/store.ts` for a Prisma/PostgreSQL/MongoDB implementation — the API contract stays the same.

### Replacing JSON storage with a DB

The data layer is intentionally isolated in `lib/store.ts`. Just replace the four functions (`readAll`, `upsertEntry`, `findByDate`, `deleteEntry`) with Prisma calls. The API routes and the UI don't need to change.

---

## Data Model

A `DailyEntry` looks like this:

```json
{
  "id": "entry_1716595200000",
  "date": "2026-05-25",
  "rows": [
    {
      "stage": "No of Applications Received",
      "subStage": "",
      "counts": {
        "No Parents": 0,
        "PWD": 0,
        "Last Year Passed Out": 0,
        "SC-A": 0,
        "SLR": 0,
        "ST": 0,
        "BC-M": 0,
        "Single Parent (FG)": 0
      }
    }
  ],
  "createdAt": "2026-05-25T09:00:00.000Z",
  "updatedAt": "2026-05-25T09:00:00.000Z"
}
```

15 rows per day total (9 stages, with HV/WL/R, Select/Hold/Reject expanding 2 of them into 3 sub-rows each).

---

## Design System Notes

The app matches the CSR Management aesthetic:

- **Primary blue** `#0F6CBD` (Fluent UI brand)
- **Accent teal** `#0099BC`
- **Success green** `#107C10`, **Warning orange** `#F7630C`, **Danger red** `#C50F1F`
- **Segoe UI** font stack (Fluent default)
- **Subtle Fluent shadows** on cards (`shadow-fluent`)
- **Rounded `md`/`lg`** corners, **8px grid** spacing
- **Sticky table headers** and **alternating row stripes**

---

## Roadmap / Easy Next Steps

- Auth (NextAuth.js) — restrict to Agaram Foundation staff
- Postgres + Prisma — multi-user editing, audit log
- CSV / Excel export from the History Log
- Looker Studio / Power BI direct connection (the JSON file is already in long-friendly format; we can add an endpoint that emits long-format CSV)
- Multi-programme support — add a "Programme" dropdown above the table so the same UI works for other CSR initiatives

Let me know which of these to ship next.
