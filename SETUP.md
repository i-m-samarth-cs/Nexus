# NEXUS — Setup & Launch Guide

## Prerequisites

1. **Node.js** (v18+) — https://nodejs.org/en/download
2. **PostgreSQL** (v14+) — https://www.postgresql.org/download/windows/
   - Or use a free cloud DB: https://neon.tech (free tier, no install needed)

---

## Step 1 — Database

### Option A: Local PostgreSQL
```
createdb nexus_db
```

### Option B: Neon (cloud, zero-install)
1. Sign up at https://neon.tech
2. Create a project → copy the connection string

---

## Step 2 — Backend

```bash
cd nexus/backend

# Copy and fill in env file
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT secrets, and ANTHROPIC_API_KEY

# Install dependencies
npm install

# Run database migrations
npm run prisma:migrate

# Start the backend
npm run dev
```

Backend runs on http://localhost:3001

---

## Step 3 — Frontend

```bash
cd nexus/frontend

npm install
npm run dev
```

Frontend runs on http://localhost:5173

---

## Step 4 — Get your Anthropic API key

1. Go to https://console.anthropic.com
2. API Keys → Create Key
3. Paste into backend `.env` as `ANTHROPIC_API_KEY`

The AI triage engine (COMMS INTELLIGENCE panel) requires this key.
Everything else in the app works without it.

---

## Environment Variables (.env)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random 32+ char secret for access tokens |
| `JWT_REFRESH_SECRET` | Random 32+ char secret for refresh tokens |
| `ANTHROPIC_API_KEY` | Claude API key for triage engine |
| `PORT` | Backend port (default: 3001) |
| `CLIENT_URL` | Frontend URL for CORS (default: http://localhost:5173) |

Generate secure secrets:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Project Structure

```
nexus/
├── backend/
│   ├── prisma/schema.prisma      # Database schema (5 tables)
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── middleware/auth.js    # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.js           # Login, register, refresh, logout
│   │   │   ├── subjects.js       # Subject CRUD
│   │   │   ├── deadlines.js      # Deadline CRUD
│   │   │   ├── sessions.js       # Study session logging
│   │   │   └── triage.js         # AI triage with daily cache
│   │   └── services/
│   │       └── triageEngine.js   # Claude Sonnet integration
│   └── package.json
│
└── frontend/
    └── src/
        ├── App.jsx               # Router + auth guard
        ├── store/index.js        # Zustand global state
        ├── utils/riskScore.js    # Deterministic risk algorithm
        ├── hooks/useCountdown.js # Live countdown timer
        ├── components/
        │   ├── Layout.jsx        # Nav bar
        │   ├── auth/             # (inline in pages/Auth.jsx)
        │   └── warroom/
        │       ├── ThreatMatrix.jsx      # Scatter plot radar
        │       ├── MissionQueue.jsx      # AI priority list
        │       ├── ActiveCountdowns.jsx  # Live countdown timers
        │       ├── CommsIntelligence.jsx # AI typewriter briefing
        │       └── SectorMap.jsx         # 30-day timeline
        └── pages/
            ├── Auth.jsx              # Login / Register
            ├── WarRoom.jsx           # Main war room (5 zones)
            ├── SubjectCommand.jsx    # Per-subject deep view
            ├── SessionMode.jsx       # Focus timer + mission log
            ├── IntelligenceReport.jsx # Weekly analytics
            └── Setup.jsx             # Semester configuration
```
