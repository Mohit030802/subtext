# Subtext — AI Contract Intelligence Platform

> **Read between the lines.** Intelligent contract analysis, risk detection, deadline extraction, and lifecycle management with native PDF clause highlighting and Google Workspace sync.

---

## Overview

Subtext is a full-stack contract intelligence platform that helps agencies, project managers, and legal teams review and manage commercial agreements:

- **Hierarchical Vault**: Organize contracts cleanly by **Client → Project → Document** with complete version history.
- **Native PDF Clause Highlights**: High-resolution in-app PDF canvas viewer (powered by PDF.js) that maps extracted risks directly to exact clauses on physical document pages with glowing bounding boxes and smooth scroll navigation.
- **Asymmetric Risk & Trap Detection**: Detects unfavorable liability caps, indemnification traps, non-competes, and termination ambiguities powered by Google Gemini 3 Flash.
- **1-Click Google Calendar Sync**: Automatically extracts critical deadlines and notice dates with one-click synchronization to Google Calendar.
- **Interactive Vault Chat**: Query any document conversationally with clause-referenced citations.
- **Seamless Google Drive Integration**: Import contracts directly via Google Drive Picker and view revisions seamlessly.

---

## Tech Stack

| Layer | Technology | Hosting / Provider |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · PDF.js Canvas · NextAuth v5 | [Vercel](https://vercel.com) |
| **Backend** | FastAPI (Python 3.12) · Async SQLAlchemy · Pydantic v2 · HTTPX | [Render](https://render.com) |
| **Database** | PostgreSQL 16 (Serverless) · asyncpg · psycopg | [Neon](https://neon.tech) |
| **AI / LLM** | Google Gemini 3 Flash (`gemini-3-flash-preview` / `gemini-2.5-flash`) | Google AI Studio |
| **Integrations**| Google Drive API (Picker & Media Export) · Google Calendar API | Google Cloud Platform |
| **CI / CD** | GitHub Actions (CI & Render Deploy Hook) | GitHub |

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Vercel (Frontend)                    │
│   Next.js 16 · NextAuth v5 · PDF.js Canvas Viewer     │
│        https://subtext-dusky.vercel.app                │
└───────────┬────────────────────────────────┬───────────┘
            │ OAuth & Drive Tokens           │ REST API
            ▼                                ▼
┌───────────────────────┐       ┌────────────────────────┐
│     Google Cloud      │       │     Render (Backend)   │
│ • Google Drive API    │       │ FastAPI · Async Engine │
│ • Google Calendar API │       │ Gemini Contract Engine │
│ • Google OAuth 2.0    │       └───────────┬────────────┘
└───────────────────────┘                   │ asyncpg
                                            ▼
                                ┌────────────────────────┐
                                │      Neon Database     │
                                │  Serverless Postgres   │
                                └────────────────────────┘
```

---

## Quick Start (Local Development)

### Prerequisites
- **Node.js** 20+
- **Python** 3.11+
- **PostgreSQL** instance (local or Neon free tier)
- **Google Cloud Console** project with Drive, Calendar, and OAuth enabled

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows (PowerShell: .venv\Scripts\Activate.ps1)
# source .venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Ensure `backend/.env` contains:
```ini
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>/<database>?ssl=require
SYNC_DATABASE_URL=postgresql+psycopg://<user>:<password>@<host>/<database>?ssl=require
AUTH_SECRET=your-32-character-random-secret
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
CORS_ORIGINS=http://localhost:3000,https://subtext-dusky.vercel.app
```

Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Ensure `frontend/.env.local` contains:
```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

AUTH_SECRET=your-32-character-random-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Run the frontend dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Google Cloud Console Configuration

To enable Google Sign-In, Google Drive Picker, and Google Calendar Sync:

1. Open the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Enable the following APIs under **APIs & Services → Enabled APIs & Services**:
   - **Google Drive API**
   - **Google Calendar API**
3. Under **OAuth 2.0 Client IDs**, select your Web Client and configure:

### Authorized JavaScript origins
```text
http://localhost:3000
https://subtext-dusky.vercel.app
```

### Authorized redirect URIs
```text
http://localhost:3000
http://localhost:3000/api/auth/callback/google
https://subtext-dusky.vercel.app
https://subtext-dusky.vercel.app/api/auth/callback/google
```

---

## Deployment & CI/CD

### 1. Frontend (Vercel)
- Connect your GitHub repository to Vercel.
- Set Framework Preset to **Next.js**.
- Root directory: `frontend`.
- Add environment variables: `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Every push to `main` automatically deploys to production.

### 2. Backend (Render)
- Create a new **Web Service** on Render connected to the repository.
- Root directory: `backend`.
- Build Command: `pip install -r requirements.txt`.
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Add backend environment variables (`DATABASE_URL`, `GEMINI_API_KEY`, etc.).

### 3. Deploy Hook (GitHub Actions)
To trigger Render deployment automatically via GitHub Actions:
1. In Render, go to your Web Service **Settings → Deploy Hook**.
2. Copy the Deploy Hook URL.
3. In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: `https://api.render.com/deploy/srv-xxxx?key=yyyy`
4. Pushing to `main` triggers `.github/workflows/deploy.yml` which triggers Render's deploy hook automatically.

---

## Key Features in Detail

### 1. Native PDF Canvas Clause Highlighting
Unlike plain-text readers or Google Drive preview iframes (which block DOM access via cross-origin policy), Subtext renders PDF contracts on an HTML5 `<canvas>` via PDF.js. When a risk or obligation is selected:
- Text bounding boxes are computed across font baselines, ascenders, and descenders.
- Glowing, color-coded highlight boxes pulse directly over the target clauses.
- The document smoothly auto-scrolls the active page and clause into view.

### 2. Post-Analysis Calendar Prompt
After Gemini finishes analyzing a contract, a prompt surfaces extracted deadlines with 1-click batch synchronization to Google Calendar. Google Identity Services tokens are cached in `sessionStorage` with email hints to eliminate annoying "Choose an account" permission loops.

---

## License

MIT © Subtext
