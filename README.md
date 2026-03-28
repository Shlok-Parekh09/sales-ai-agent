# CustBuds CRM

An AI-native CRM for modern sales teams — built with React, TypeScript, and a Node.js backend. CustBuds combines a full-featured pipeline manager with autonomous AI agents that research prospects, score fit, write personalized outreach sequences, and monitor deal health in real time.

---

## Features

### CRM Core

**Contacts** — Create, import, search, sort, and paginate contacts. Double-click any cell to inline-edit fields. Ctrl+click a contact name to open a full details modal. Export the table as CSV at any time.

**Companies** — Full company table with inline editing. Create a company and immediately trigger the Prospecting Agent to generate a scored research brief and email sequence. Select any saved company and run prospecting on demand.

**Deals Pipeline** — Two-section pipeline view (Active Deals and Closed Won) with inline stage, priority, and owner editing. Tracks deal value, cycle length, and expected close date. Auto-calculates total pipeline value, average cycle, and next close date per section.

**Meetings & Calls** — Activity log tables for meetings and calls with editable fields (company, contact, owner, date, status, next steps). All activity data feeds directly into the Deal Intelligence Agent.

### AI Agents

**Prospecting Agent** (`/api/agent/prospect`) — Given a company name and optional metadata, the agent researches the target across public signals, scores product–market fit (0–100), identifies the key buying contact, writes two personalized outreach emails, generates a multi-step engagement sequence, and recommends next best actions. Results are stored locally and visible in the Prospecting Agent view.

**Deal Intelligence Agent** (`/api/agent/deal-intelligence`) — Continuously scores every active deal's health based on CRM coverage gaps, engagement recency, late-stage thread count, competitor mentions in activity notes, and timeline risk. For each at-risk deal it generates a recovery play with a headline, recommended action, and specific talking points. Alerts surface the highest-signal risks in real time.

### Email Sequences

Connect Gmail, Outlook, or a generic mailto provider from the Settings modal. Start Sequence opens a pre-filled compose window with the selected email draft and your saved signature. Schedule stores the sequence locally and shows a scheduled timestamp.

### Data Management

- CSV import with fuzzy header matching (handles variations like "Deal Value" / "Amount" / "Revenue")
- CSV export for contacts, companies, and deals
- All data is persisted to `localStorage` — no database required to run locally
- Multi-select with bulk delete across all tables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express |
| AI (Prospecting) | Groq API (LLaMA 3) |
| AI (Deal Intel) | Mistral API |
| Storage | Browser localStorage |

---

## Project Structure

```
/
├── frontend/
│   └── src/
│       ├── App.tsx               # All UI components and dashboard logic
│       ├── components/
│       │   └── CustBudsLogo.tsx  # Logo lockup component
│       ├── index.tsx             # React root
│       ├── index.css             # Tailwind directives
│       └── styles.css
└── backend/
    ├── index.js                  # Express server
    ├── routes/
    │   ├── prospect.js           # Prospecting Agent endpoint
    │   └── dealIntelligence.js   # Deal Intelligence Agent endpoint
    └── .env                      # API keys (not committed)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com) for the Prospecting Agent
- A [Mistral API key](https://console.mistral.ai) for the Deal Intelligence Agent

### 1. Clone the repo

```bash
git clone https://github.com/Shlok-Parekh09/AI_based_CRM.git
cd AI_based_CRM
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_key_here
MISTRAL_API_KEY=your_mistral_key_here
PORT=5000
```

Start the backend:

```bash
npm start
```

The backend will run at `http://localhost:5000`.

### 3. Set up the frontend

In a new terminal:

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

---

## API Reference

### `POST /api/agent/prospect`

Runs the Prospecting Agent for a given company.

**Request body:**
```json
{
  "companyName": "Acme Corp",
  "city": "Mumbai",
  "companySize": "51-200 employees",
  "type": "Prospect"
}
```

**Response:** A JSON object containing `fitScore`, `scoreReasoning`, `email1`, `email2`, `researchSummary`, `publicSignals`, `fitBreakdown`, `buyerPersonas`, `sequence`, `nextActions`, and `enrichedProfile`.

---

### `POST /api/agent/deal-intelligence`

Analyzes the current deal pipeline and returns risk alerts and recovery plays.

**Request body:**
```json
{
  "deals": [
    {
      "id": 1,
      "name": "Enterprise Deal",
      "stage": "Proposal",
      "health": 62,
      "risk": "Medium",
      "signals": ["No engagement in 9 days"],
      ...
    }
  ]
}
```

**Response:** A JSON object containing `alerts` (ranked risk signals) and `monitor` (per-deal recovery plays with talking points).

---

## Usage Tips

- **Create + Prospect** — When creating a new company, use the "Create + Prospect" button to simultaneously add the company to the CRM and trigger the AI agent. A loading banner appears while the agent works.
- **Prospect selected** — In the Companies table, select a single company row and click "Prospect selected" to run the agent against an existing record.
- **Prospect All** — From the Prospecting Agent view, click "Prospect All" to batch-research every saved company in sequence.
- **Inline editing** — Double-click any text cell in any table to edit it in place. Press Enter to commit or Escape to cancel.
- **Deal health scoring** — The health score is recalculated every 15 seconds and on window focus, so it always reflects the latest CRM activity.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

MIT
