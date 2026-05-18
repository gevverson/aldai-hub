# Macho ya Mwananchi — Citizen's Eye

**Pesa Yako. Wapi Ilikwenda?** — *Your Money. Where Did It Go?*

A civic accountability platform exposing ghost projects, stalled infrastructure, and public fund misuse in Aldai Constituency and Nandi County, Kenya. Built on official Office of the Auditor-General (OAG) findings.

---

## What It Does

- **Project Ledger** — 14 OAG-documented projects mapped across 6 wards with GPS coordinates, official vs. community status, and direct audit citations
- **GPS Citizen Verification** — Citizens submit photo evidence + live GPS coordinates; a consensus engine automatically updates project status when enough verifications agree
- **AI Audit Translator** — Ask questions in Swahili or English; answers come from real OAG reports via a RAG pipeline (ChromaDB + Gemini), with a direct-Gemini fallback
- **Anonymous Report Submission** — Submit corruption reports; receive a tracking code; zero personal data collected
- **Evidence Map** — Leaflet map with colour-coded project markers and citizen verification pins

---

## Architecture

```
client/          React 18 + Vite + Tailwind CSS + Leaflet
server/          Node.js + Express 4 + Mongoose + MongoDB
ai-service/      FastAPI + ChromaDB + Google Gemini SDK
```

The Node server proxies all AI requests to the Python service and falls back to direct Gemini API if the service is unreachable — citizens always get an answer.

---

## Prerequisites

- Node.js 18+
- Python 3.11+ with `venv`
- MongoDB (local or Atlas)
- Anthropic API key

---

## Quick Start (Docker — recommended)

Requires Docker and Docker Compose.

```bash
# 1. Copy and fill in your keys
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY and ADMIN_TOKEN

# 2. Start all services (MongoDB + Node server + AI service + nginx/React)
docker compose up --build -d

# 3. Seed the database (first run only)
docker compose run --rm seed

# App is live at http://localhost
```

To stop: `docker compose down`
To wipe all data: `docker compose down -v`

---

## Manual Setup (Development)

### 1. Clone and install

```bash
git clone https://github.com/gevverson/aldai-hub.git
cd aldai-hub
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env — set MONGO_URI and ANTHROPIC_API_KEY at minimum
```

### 3. Start MongoDB

```bash
# Local
mongod --dbpath /data/db

# Or use MongoDB Atlas — set MONGO_URI in .env
```

### 4. Seed the database

```bash
cd server
npm install
node seed_db.js
```

Expected output: `✅ 14 projects seeded successfully`

### 5. Start the Node server

```bash
# From server/
npm run dev        # development (auto-reload)
npm start          # production
```

Server runs on `http://localhost:3001`

### 6. Start the AI service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8002 --reload
```

The AI service seeds ChromaDB with OAG knowledge on first startup.

### 7. Start the frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `ANTHROPIC_API_KEY` | Yes | For AI audit fallback and Python RAG service |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | `development` or `production` |
| `CLIENT_URL` | No | Allowed CORS origin (default: `http://localhost:5173`) |
| `ADMIN_TOKEN` | Yes | Secret for `/api/audit/ingest` — generate with `openssl rand -hex 32` |
| `AI_SERVICE_URL` | No | Python service URL (default: `http://localhost:8002`) |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | All projects (filter: `?ward=X&category=X&status=critical`) |
| GET | `/api/projects/stats` | Dashboard counts |
| GET | `/api/projects/wards` | Ward metadata with live DB counts |
| GET | `/api/projects/ward/:wardName` | Ward detail with projects |
| GET | `/api/projects/:id` | Single project |
| POST | `/api/reports` | Submit anonymous report |
| GET | `/api/reports` | Report feed (paginated) |
| GET | `/api/reports/today-count` | Today's report count |
| POST | `/api/verifications` | Submit citizen verification (multipart/form-data) |
| GET | `/api/verifications/map` | All verifications for map pins |
| GET | `/api/verifications/recent` | Latest 5 verifications |
| GET | `/api/verifications/:projectId` | Verifications for a project + consensus summary |
| POST | `/api/audit/query` | AI question answering (Swahili or English) |
| GET | `/api/audit/status` | AI service health check |
| GET | `/api/health` | Server health check |

---

## Security

- Helmet security headers
- Rate limiting: 100 req/15min general · 5 reports/hr · 10 verifications/hr · 20 AI queries/hr
- MongoDB NoSQL injection prevention (`express-mongo-sanitize`)
- Input validation on all POST routes (`express-validator`)
- CORS restricted to configured origins
- No IP addresses logged in production (`tiny` morgan format)
- GPS coordinates rounded to ~100m grid for citizen privacy

---

## Data Sources

All project data is sourced from:
- **OAG Aldai NG-CDF Audit 2018/2019** — National Government Constituencies Development Fund
- **OAG Nandi County Executive Audit 2021/22 and 2023/24** — County government expenditure

Every entry is a documented audit finding, not an allegation.

---

## License

MIT — see [LICENSE](LICENSE)

---

*"Ukweli ni nguvu." — The truth is power.*
