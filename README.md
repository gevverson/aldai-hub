# Macho ya Mwananchi — Citizen's Eye

**Pesa Yako. Wapi Ilikwenda?** — *Your Money. Where Did It Go?*

A civic accountability platform that turns Kenya's official Office of the Auditor-General (OAG) reports into something an ordinary citizen can actually read. Every project, figure, and finding on the platform is extracted from a published government audit and cited back to the report and page it came from.

🌐 **Live site:** https://macho-ya-mwananchi-client.onrender.com

[![E2E Tests](https://github.com/gevverson/aldai-hub/actions/workflows/e2e.yml/badge.svg)](https://github.com/gevverson/aldai-hub/actions/workflows/e2e.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

---

## Coverage

| | |
|---|---|
| **Counties with audit data** | **47 of 47** |
| — with a per-project register | 19 |
| — findings-only (no register published by OAG) | 28 |
| **Projects tracked** | **1,449** |
| **Audit findings** | **8,551** |
| **Constituencies catalogued** | 290 |
| **Source documents indexed** | 46 OAG PDFs (FY2016/17 – FY2024/25) |

Not every OAG report contains a per-project verification appendix — many are narrative-only. Where no register exists, the platform shows the **audit findings** (opinion, basis, flagged amounts) rather than inventing projects. That distinction is deliberate and is explained on the in-app [Methodology page](https://macho-ya-mwananchi-client.onrender.com/methodology).

---

## Origin & Creator

**Built by [Gevverson Kipkoech](https://github.com/gevverson)**
AI Software Engineer · LLM & Automation Specialist · Full-Stack Architect
Nairobi, Kenya

This platform was conceived, designed, and built from scratch by Gevverson Kipkoech in 2026 — starting from deep research into official OAG audit reports for Aldai Constituency, Nandi County, and since expanded to all 47 counties.

> *"I built this because the data existed but the people it affected couldn't access it. OAG reports are public — but a 400-page PDF and a Nandi villager are two different worlds. This platform bridges that gap."*
> — Gevverson Kipkoech, Creator

[![GitHub](https://img.shields.io/badge/GitHub-gevverson-black?logo=github)](https://github.com/gevverson)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Gevverson%20Kipkoech-blue?logo=linkedin)](https://linkedin.com/in/gevverson-kipkoech)

---

## What It Does

- **Project Ledger** — 1,449 OAG-documented projects across 19 counties, each with allocation, official vs. community status, and a direct citation to report + page.
- **Audit Findings Layer** — 8,551 cited findings covering all 47 counties, so counties whose reports are narrative-only still show real, sourced data instead of an empty page.
- **County → Constituency drill-down** — full 290-constituency catalogue with live rollups and honest "not yet covered" states.
- **AI Audit Translator** — ask a question in Swahili or English; answers are generated **only** from retrieved OAG report chunks, with the report and page cited. If retrieval returns nothing relevant, the service declines to answer rather than guessing.
- **GPS Citizen Verification** — citizens submit photo evidence and coordinates; a consensus engine updates project status when enough verifications agree.
- **Anonymous Report Submission** — submit a report, receive a tracking code; no personal data collected.
- **Evidence Map** — Leaflet map with colour-coded markers and citizen verification pins.

---

## Data integrity

This is the part of the project that matters most, so it is documented separately in **[DATA_PROVENANCE.md](DATA_PROVENANCE.md)** — including corrections we have made to our own published figures.

Three mechanisms enforce it in code, not just in policy:

1. **No unsourced AI answers.** `tests/guards/test_no_unsourced_answers.py` runs *first* in CI and fails the build in seconds if the AI service can answer from anything other than the indexed OAG corpus. Empty retrieval short-circuits before the model is ever called.
2. **A relevance floor.** ChromaDB returns a top-K result however poor the match, so a cosine-distance ceiling (`RELEVANCE_MAX_DISTANCE`, default `0.72`) rejects off-topic retrievals. Measured on this corpus, genuine audit questions sit at 0.41–0.63 and off-topic questions at 0.75–0.91.
3. **Amounts are never guessed.** OAG PDFs carry OCR damage that can silently inflate a figure by orders of magnitude (`47,428,765,52` read naively becomes 4.74 billion). `ai-service/pipeline/money.py` handles the four observed corruption classes and returns **null rather than a guess** when a figure cannot be read confidently.

---

## Architecture

```
client/          React 18 + Vite + Tailwind CSS + Leaflet   → static site on Render
server/          Node.js + Express 4 + Mongoose + MongoDB   → API on Render
ai-service/      FastAPI + ChromaDB + Google Gemini         → RAG service on Render
```

The Node server proxies AI requests to the Python RAG service. The vector index is **built at deploy time** (`ingest_all.py` in the build step) and shipped with the image, because Render's free tier gives the container an ephemeral disk — an index built after boot does not survive a cold start.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 3, Leaflet, Framer Motion |
| Backend | Node.js 22, Express 4, Mongoose 9, MongoDB Atlas |
| AI / RAG | FastAPI, ChromaDB, Google Gemini (`gemini-3.6-flash` → `gemini-3.7-flash` → `gemini-flash-latest`) |
| Embeddings | ChromaDB ONNX `DefaultEmbeddingFunction` — computed locally, no API quota |
| Security | Helmet, express-rate-limit, express-mongo-sanitize, express-validator |
| DevOps | Docker, Docker Compose, Render, GitHub Actions CI |
| Testing | Playwright E2E (61 tests) + Node test runner + a Python CI guard |

The Gemini model is an ordered **chain**, not a single pinned name: only a 404/`NOT_FOUND` walks to the next candidate, so a retired model degrades instead of taking the service offline. Override with `GEMINI_MODEL`. (Audit AI was offline for three months in 2026 because `gemini-2.0-flash` was retired and the name was hardcoded — hence the chain.)

---

## Quick Start (Docker — recommended)

```bash
cp .env.example .env
# Edit .env — set GEMINI_API_KEY and ADMIN_TOKEN

docker compose up --build -d
docker compose run --rm seed      # first run only

# App is live at http://localhost
```

Stop with `docker compose down`; wipe data with `docker compose down -v`.

---

## Manual Setup (Development)

```bash
git clone https://github.com/gevverson/aldai-hub.git
cd aldai-hub
```

**1. Configure**

```bash
cp server/.env.example server/.env
# Set MONGO_URI and GEMINI_API_KEY at minimum
```

**2. MongoDB** — run `mongod --dbpath /data/db` locally, or point `MONGO_URI` at Atlas.

**3. Seed**

```bash
cd server && npm install && node seed_db.js
```

`seed_db.js` replaces the **Project** and **Finding** collections only. Citizen-submitted Reports and Verifications are never touched.

**4. Node server**

```bash
npm run dev        # auto-reload
npm start          # production
```
Runs on `http://localhost:3001`.

**5. AI service**

```bash
cd ai-service
python3 -m venv venv
venv/bin/python -m pip install -r requirements.txt
venv/bin/uvicorn main:app --port 8002 --reload
```

The virtualenv is **not** committed — it is a build artefact of `requirements.txt`.

Build the vector index once (46 PDFs → ~3,003 chunks, ~5 min, CPU-only):

```bash
venv/bin/python ingest_all.py
```

**6. Frontend**

```bash
cd client && npm install && npm run dev
```
Runs on `http://localhost:5173`.

---

## Environment Variables

**Node server**

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini key — free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `ADMIN_TOKEN` | Yes | Secret for admin routes — `openssl rand -hex 32` |
| `PORT` | No | Server port (default `3001`) |
| `NODE_ENV` | No | `development` \| `production` |
| `CLIENT_URL` | No | Comma-separated CORS allowlist (default `http://localhost:5173`) |
| `AI_SERVICE_URL` | No | Python service URL (default `http://localhost:8002`) |
| `AUDIT_ALERT_WEBHOOK` | No | Webhook for AI failure alerts |
| `DISABLE_RATE_LIMIT` | No | Set to `1` for hermetic E2E runs only — never in production |

**AI service**

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Same key as above |
| `GEMINI_MODEL` | No | Comma-separated model chain (default `gemini-3.6-flash,gemini-3.7-flash,gemini-flash-latest`) |
| `RELEVANCE_MAX_DISTANCE` | No | Cosine-distance ceiling for retrieval (default `0.72`) |
| `ALLOWED_ORIGINS` | No | CORS allowlist for the FastAPI service |
| `INGEST_CORPUS_ON_STARTUP` | No | Ingest at boot instead of build time |
| `ADMIN_TOKEN` | No | Protects `/ingest` |

**Client**

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | API base URL (default: same-origin `/api`) |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/projects` | Projects — `?county=&constituency=&ward=&category=&year=&fund=&status=critical&countyWide=true` |
| GET | `/api/projects/stats` | Dashboard counts |
| GET | `/api/projects/wards` | Ward metadata with live DB counts |
| GET | `/api/projects/map` | Geolocated projects for map markers |
| GET | `/api/projects/ward/:wardName` | Ward detail with projects |
| GET | `/api/projects/:id` | Single project |
| GET | `/api/findings` | Audit findings — `?county=&constituency=&year=` |
| GET | `/api/findings/summary/:constituency` | Findings rollup for one constituency |
| GET | `/api/geography` | Full 47-county tree with live rollups |
| GET | `/api/geography/:county` | One county's constituencies |
| POST | `/api/reports` | Submit anonymous report (returns tracking code) |
| GET | `/api/reports` | Report feed (paginated) |
| GET | `/api/reports/today-count` | Today's report count |
| GET | `/api/reports/track/:code` | Look up a report by tracking code |
| POST | `/api/verifications` | Submit citizen verification (`multipart/form-data`) |
| GET | `/api/verifications/map` | All verifications for map pins |
| GET | `/api/verifications/recent` | Recent verifications |
| GET | `/api/verifications/:projectId` | Verifications for a project + consensus summary |
| POST | `/api/audit/query` | AI question answering (Swahili or English) |
| GET | `/api/audit/documents` | Indexed corpus inventory |
| POST | `/api/audit/ingest` | Trigger ingestion (admin) |
| GET | `/api/audit/status` | AI service health |

---

## Testing

GitHub Actions runs the full suite on every push and PR to `main`, against an **ephemeral MongoDB service container** — never production data.

```bash
npm run test:e2e          # 61 Playwright tests
cd server && npm test     # Node test runner (audit router)
python3 tests/guards/test_no_unsourced_answers.py
```

> ⚠️ **`playwright.config.js` defaults `BASE_URL` and `SERVER_URL` to production.**
> A bare `npx playwright test` therefore tests the **live deployed site**, not your local changes — it will report failures unrelated to your work. To test your own code, replicate CI:
>
> ```bash
> mongod --dbpath /tmp/mym --port 27099 &
> cd server && MONGO_URI=mongodb://127.0.0.1:27099/mym npm run seed
> DISABLE_RATE_LIMIT=1 PORT=3199 MONGO_URI=mongodb://127.0.0.1:27099/mym node server.js &
> cd ../client && npm run build && npx vite preview --port 4199 &
> BASE_URL=http://127.0.0.1:4199 SERVER_URL=http://127.0.0.1:3199 CI=true npx playwright test
> ```

---

## Security

- Helmet security headers (CSP enabled in production)
- CORS restricted to a configured allowlist — never `*`
- Rate limiting: 100 req/15 min general · 5 reports/hr · 10 verifications/hr · 20 AI queries/hr
- NoSQL injection prevention (`express-mongo-sanitize`) and regex escaping on every user-supplied filter
- Input validation on all POST routes (`express-validator`)
- `trust proxy` configured so rate limits apply per real client IP behind Render's proxy
- Production request logs use morgan `tiny`, which does not record client IP addresses
- Vault routes are excluded from request logging entirely
- EXIF metadata stripped from every uploaded photo (`sharp`, orientation applied then discarded)
- Fail-fast configuration validation — the server refuses to boot misconfigured in production

To report a vulnerability, see **[SECURITY.md](SECURITY.md)**. Please do not open a public issue.

---

## Data Sources

All data is sourced exclusively from official government publications:

- **Office of the Auditor-General** ([oagkenya.go.ke](https://www.oagkenya.go.ke)) — NG-CDF constituency audits and County Executive/Assembly audits, FY2016/17 – FY2021/22
- **Parliament of Kenya Library** ([libraryir.parliament.go.ke](https://libraryir.parliament.go.ke)) — County audits FY2022/23 – FY2024/25

46 reports are indexed. Every entry is a documented audit finding, not an allegation, and carries its report and page citation.

The pipeline that produces this data is reproducible and lives in `ai-service/pipeline/` — see [DATA_PROVENANCE.md](DATA_PROVENANCE.md) §4.

**Corrections and right of reply:** if you are named in or responsible for anything published here and believe it is inaccurate, write to **gevversonkipkoech83@gmail.com**. Corrections policy is on the in-app Methodology page.

---

## Roadmap

- [x] Multi-constituency support (expand beyond Aldai)
- [x] All 47 Kenya counties
- [x] Constituency-level audit findings for narrative-only reports
- [x] Reproducible OAG ingestion pipeline
- [ ] Geocode projects — only 6 of 1,449 currently have coordinates
- [ ] Render `amountNote` in the UI so OCR-corrected figures show their correction
- [ ] Round stored verification coordinates to a coarse grid for citizen privacy
- [ ] OCR the one image-only PDF in the corpus (Nandi Covid-19 vaccine rollout)
- [ ] Migrate `google-generativeai` → `google.genai` (predecessor SDK is end-of-life)
- [ ] Swahili-first UI option
- [ ] SMS report submission (for feature phones)

---

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)**. The one rule that matters most: **no figure enters this repository without a citation to the OAG report and page it came from.**

---

## Attribution

If you fork or build on this project, you must:

1. Retain the original creator credit: **Gevverson Kipkoech** (`github.com/gevverson`)
2. Keep this project open source under GPL-3.0
3. Not misrepresent the origin of this work

---

## License

**GNU General Public License v3.0** — see [LICENSE](LICENSE)

If you modify and distribute this code, your version must also be open source.

Copyright (C) 2026 **Gevverson Kipkoech**

---

*"Ukweli ni nguvu." — The truth is power.*
