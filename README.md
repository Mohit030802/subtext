# Subtext — AI Contract Intelligence

> **Read between the lines.** AI-powered contract analysis, risk detection, and lifecycle management platform.

---

## Overview

Subtext is a full-stack contract intelligence platform that helps agencies, project managers, and businesses:
- **Organize** documents hierarchically (Client → Project → Document)
- **Detect** asymmetric risk clauses and deceptive language automatically
- **Extract** deadlines and obligations with calendar sync
- **Negotiate** with AI-generated redline suggestions
- **Chat** with contracts via the Vault Chat assistant

---

## Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 15 (App Router) · JavaScript · Tailwind CSS v4 · Inter font |
| **Backend** | FastAPI (Python) · Async SQLAlchemy · Alembic |
| **Database** | PostgreSQL 16 + pgvector |
| **Queue** | Redis + Celery |
| **AI** | Google Gemini API · LangChain |
| **Infrastructure** | Docker Compose |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### 1. Clone & configure
```bash
git clone https://github.com/YOUR_USERNAME/subtext.git
cd subtext
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Start infrastructure (Postgres + Redis)
```bash
docker compose up -d
```

### 3. Start the backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
subtext/
├── frontend/          # Next.js 15 app (JavaScript)
│   └── src/
│       ├── app/       # App Router pages
│       ├── components/
│       │   ├── dashboard/
│       │   ├── document/
│       │   └── layout/
│       └── lib/       # Utilities, mock data, theme
├── backend/           # FastAPI app
│   └── app/
│       ├── api/
│       ├── core/
│       └── models/
├── docker-compose.yml
└── .env.example
```

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables including:
- `GEMINI_API_KEY` — Google Gemini API key
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string

---

## Status

🚧 **Phase 1 — Demo Mode**: Frontend is complete with mock data. Backend API and AI pipeline are in active development.
