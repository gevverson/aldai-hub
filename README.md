# Macho ya Mwananchi — Citizen's Eye

**Pesa Yako. Wapi Ilikwenda?** — *Your Money. Where Did It Go?*

A civic accountability platform exposing ghost projects, stalled infrastructure, and public fund misuse in Aldai Constituency and Nandi County, Kenya. Built entirely on official Office of the Auditor-General (OAG) findings.

🌐 **Live site:** https://macho-ya-mwananchi-client.onrender.com

---

## Origin & Creator

**Built by [Gevverson Kipkoech](https://github.com/gevverson)**
AI Software Engineer · LLM & Automation Specialist · Full-Stack Architect
Nairobi, Kenya

This platform was conceived, designed, and built from scratch by Gevverson Kipkoech in 2026 — starting from deep research into official OAG audit reports for Aldai Constituency, Nandi County. Every project, every figure, and every audit finding on this platform was manually verified against published government documents.

The goal: make Kenya's official audit findings accessible to ordinary citizens — not just accountants and policy researchers.

> *"I built this because the data existed but the people it affected couldn't access it. OAG reports are public — but a 400-page PDF and a Nandi villager are two different worlds. This platform bridges that gap."*
> — Gevverson Kipkoech, Creator

[![GitHub](https://img.shields.io/badge/GitHub-gevverson-black?logo=github)](https://github.com/gevverson)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Gevverson%20Kipkoech-blue?logo=linkedin)](https://linkedin.com/in/gevverson-kipkoech)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

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

The Node server proxies all AI requests to the Python RAG service and falls back to direct Gemini API if the service is unreachable — citizens always get an answer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Leaflet, Framer Motion |
| Backend | Node.js, Express 4, Mongoose, MongoDB Atlas |
| AI / RAG | FastAPI, ChromaDB, Google Gemini 2.5 Flash |
| Auth & Security | Helmet, express-rate-limit, express-mongo-sanitize, express-validator |
| DevOps | Docker, Docker Compose, Render, GitHub Actions CI/CD |
| Testing | Playwright E2E (52 tests across all pages and features) |

---

## Quick Start (Docker — recommended)

Requires Docker and Docker Compose.

```bash
# 1. Copy and fill in your keys
cp .env.example .env
# Edit .env — set GEMINI_API_KEY and ADMIN_TOKEN

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

### 1. Clone

```bash
git clone https://github.com/gevverson/aldai-hub.git
cd aldai-hub
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env — set MONGO_URI and GEMINI_API_KEY at minimum
```

### 3. Start MongoDB

```bash
# Local
mongod --dbpath /data/db

# Or use MongoDB Atlas — set MONGO_URI in server/.env
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
| `GEMINI_API_KEY` | Yes | Google Gemini API key (free at aistudio.google.com) |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | `development` or `production` |
| `CLIENT_URL` | No | Allowed CORS origin (default: `http://localhost:5173`) |
| `ADMIN_TOKEN` | Yes | Secret for admin routes — generate with `openssl rand -hex 32` |
| `AI_SERVICE_URL` | No | Python service URL (default: `http://localhost:8002`) |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
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
| GET | `/api/verifications/:projectId` | Verifications for a project + consensus summary |
| POST | `/api/audit/query` | AI question answering (Swahili or English) |
| GET | `/api/audit/status` | AI service health check |

---

## CI/CD

GitHub Actions runs 52 Playwright E2E tests on every push and pull request to `main`. Tests cover:

- API health, all 6 ward pages, verify modal (all interactions)
- Map (markers, filters, popups, zoom)
- AI Audit (language toggle, structured answer)
- Report form (validation, submission)
- About page, footer credits, mobile navigation

---

## Security

- Helmet security headers
- Rate limiting: 100 req/15min general · 5 reports/hr · 10 verifications/hr · 20 AI queries/hr
- MongoDB NoSQL injection prevention (`express-mongo-sanitize`)
- Input validation on all POST routes (`express-validator`)
- CORS restricted to configured origins
- No IP addresses logged in production
- GPS coordinates rounded to ~100m grid for citizen privacy
- EXIF metadata stripped from all photo uploads

---

## Data Sources

All project data is sourced exclusively from official government documents:

- **OAG Aldai NG-CDF Audit 2018/2019** — National Government Constituencies Development Fund
- **OAG Nandi County Executive Audit 2021/22 and 2023/24** — County government expenditure

Every entry is a documented audit finding, not an allegation. Source citations are included on every project card.

---

## Roadmap

- [ ] Multi-constituency support (expand beyond Aldai)
- [ ] All 47 Kenya counties
- [ ] Swahili-first UI option
- [ ] SMS report submission (for feature phones)
- [ ] Automatic OAG report ingestion pipeline

---

## Attribution

If you fork or build on this project, you must:

1. Retain the original creator credit: **Gevverson Kipkoech** (`github.com/gevverson`)
2. Keep this project open source under GPL-3.0
3. Not misrepresent the origin of this work

---

## License

**GNU General Public License v3.0** — see [LICENSE](LICENSE)

Key implication: if you modify and distribute this code, your version must also be open source. You cannot take this code proprietary.

Copyright (C) 2026 **Gevverson Kipkoech**

---

*"Ukweli ni nguvu." — The truth is power.*
