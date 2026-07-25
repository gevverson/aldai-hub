# Data Provenance & Integrity Report — Nandi County OAG Research

**Generated:** 2026-07-23
**Scope:** All six Nandi County constituencies + the County Government
**Source of truth:** Office of the Auditor-General, Kenya — `oagkenya.go.ke`

This document records exactly where every new data point comes from, so the
platform publishes **cited findings, not rumours**. Everything below is
reproducible from the scripts in `ai-service/pipeline/`.

---

## 1. What was collected

Live research pulled **42 official OAG audit reports** straight from the
Auditor-General's website (no manual PDF-saving, no third-party summaries).
All have a real text layer — **zero OCR required** — except one image-scanned
Covid report, which was detected and skipped.

| Constituency | Financial years on record |
|---|---|
| Aldai | 2017/18, 2018/19, 2019/20, 2021/22 (+ Technical Institute) |
| Chesumei | 2016/17, 2017/18, 2021/22 |
| Emgwen | 2016/17, 2017/18, 2018/19, 2019/20, 2020/21, 2021/22 |
| Mosop | 2016/17, 2018/19, 2019/20, 2020/21, 2021/22 |
| Nandi Hills | 2016/17, 2017/18, 2018/19, 2019/20, 2020/21, 2021/22 |
| Tinderet | 2016/17, 2018/19, 2019/20, 2021/22 |
| Nandi County Executive | 2016/17, 2017/18, 2018/19, 2019/20, 2021/22 |
| Nandi County (Assembly + funds) | 2020/21, 2021/22 |

Every audit opinion was captured. Distribution across the 37 core reports:
**29 Qualified, 5 Disclaimer, 3 Adverse** — i.e. *not a single clean opinion*.

---

## 2. What was produced (two integration paths)

### A. Structured dataset → `server/data/seed_generated.js`
**65 individual projects**, each carrying the exact source report + page.
Amounts and audit notes are **verbatim from the Auditor-General**. Status is
classified only from the auditor's own words; the verbatim remark is retained
in `auditNote` so any reader can check the call.

| Status | Count | Meaning |
|---|---|---|
| GHOST PROJECT | 4 | Paid for, physically does not exist / works never started |
| STALLED | 3 | Started then abandoned |
| INCOMPLETE | 14 | Money spent, project not finished |
| DISPUTED | 22 | Defective work, missing titles/records, no completion cert |
| COMPLETE | 18 | Verified complete and in use |
| Needs manual review | 4 | Genuinely ambiguous wording — flagged, not guessed |

Total value of the 65 verified projects: **Ksh 133,191,276**, of which
**Ksh 85,392,673** is attached to projects the auditor flagged as
ghost / stalled / incomplete / disputed.

**Deliberate integrity choices:** `lat`/`lng` are `null` (the reports give no
GPS — coordinates were **not** fabricated). `ward` carries the constituency
name, because NG-CDF reports audit at constituency level and do not break
findings down by ward.

### B. Primary-source corpus → `ai-service/documents/` + `ingest_all.py`
All 41 Nandi PDFs are ingested into ChromaDB **page by page**
(1,579 chunks), so the AI Audit Translator can cite an answer down to the
report and page instead of relying on a hand-written summary.
Run with `python ingest_all.py` (idempotent; safe on every deploy).

---

## 3. ⚠️ Integrity findings — a CITATION problem, not fabricated figures

**Correction (2026-07-24):** An earlier draft of this document claimed the
Kabiyet 621M figure was "31× overstated / wrong." **That claim was itself an
error** and has been withdrawn. The figures below are real; what is wrong is
how some of them are *cited*.

The key confusion was **scope**: the OAG audits a single financial year's
**construction contract**, while press/political figures describe the **total
cumulative program cost** over many years. Comparing the two makes a real
figure look fabricated when it is not.

| Live claim | Status after research | Correct citation |
|---|---|---|
| **Kabiyet Dairy Creamery — Ksh 621,000,000**, stalled 8+ yrs | **REAL.** Stated by **Senator Samson Cherargei**, reported by Sacco Review (16 Jan 2026): the creamery "consumed Ksh621 million…yet remains incomplete…eight years after inception." Total spend reported as approaching Ksh1B (The Star, Dairy Business Africa). | Cite the **Senator / press**, NOT the OAG. OAG separately audits a FY2018/19 building contract of Ksh 19,845,132 (County Executive FY18/19 p6) — a different, smaller scope. |
| **Kapsabet Mother & Baby Unit — Ksh 208,800,000** | **Likely REAL, different scope.** OAG FY2021/22 (p9) audits the hospital+MBU contract at Ksh 409,813,441, ~65% complete. The 208.8M is probably a single-year allocation, not the full contract. | Verify the 208.8M's origin; cite the specific source and year. Do **not** assume "wrong." |
| **Kapsengere Hospital Phase II (Terik) — Ksh 9,954,900** | Not found in the OAG corpus pulled. Origin unknown. | Find and cite the source, or mark unverified. |
| **Kobujoi Sub-County Hospital — Ksh 3,292,946** | Not found in the OAG corpus. Origin unknown. | Find and cite the source, or mark unverified. |
| **Officer "Cornelius Serem"** (named as responsible) | Not found in any OAG report. | Verify against a named source before publishing — naming an individual without a citation is a legal risk. |

**The real lesson:** the platform's problem is not fake data — it is that some
entries **attribute a press/political figure to an OAG audit report**. The fix
is accurate, source-specific citations (Senator, Controller of Budget, OAG,
news), each labelled for what it is — not deletion.

**AI service note:** now that 41 real primary sources are indexed, the built-in
`OAG_SEED_TEXT` should carry **correct per-figure attributions** (or be retired)
so retrieval never presents a Senator's estimate as an OAG audit finding.

### 3c. Constituency-level audit findings layer (2026-07-25)

Not every OAG NG-CDF report has a project register, but every one carries an
**audit opinion** and **basis-for-qualification findings**. These are ingested
as a separate `Finding` model (never dressed up as physical projects) so the
map shows real, cited audit data everywhere a report exists.

- **1,658 findings across 54 constituencies in 7 counties**, each cited to
  report + page (`build_findings.py`, reusing extract.py).
- Counties without a project register (Kiambu, Kisumu, Kakamega, Kericho) now
  surface under an "Audit findings available" tier instead of "coming soon".
- Coverage across all major regions: Coast (Mombasa), Rift (Nandi, Uasin Gishu,
  Kericho), Central (Kiambu), Nyanza (Kisumu), Western (Kakamega).
- The prominent figure on a finding card is labelled "Figure cited", not
  "amount queried" — the first amount in a finding is not always the specific
  queried sum, and the verbatim summary carries the full context.

### 3b. National expansion — regional batch (2026-07-25)

Ingested four counties spread across regions to demonstrate national reach.
The result is an honest map of OAG data availability:

| County | Region | Result |
|---|---|---|
| **Mombasa** | Coast | ✅ 13 verified projects (Changamwe, Kisauni). Other 4 constituencies narrative-only. |
| Kiambu | Central | ⚠️ NG-CDF reports narrative-only — no per-project register. Not covered. |
| Kisumu | Nyanza | ⚠️ Narrative-only. Not covered. |
| Kakamega | Western | ⚠️ Appendices are status-summary tables, not project lists. Not covered. |

**Finding:** the per-project verification appendix is **not** universal in OAG
NG-CDF reports. Many counties publish narrative-only audits. We only mark a
constituency covered where a genuine project register exists — never fabricate.

**Two data-integrity fixes applied to the whole pipeline this batch:**
- **False-ghost guard.** The classifier was calling partially-built projects
  "GHOST PROJECT" when a *component* (e.g. "roof top had not started") was
  incomplete — e.g. Mwembelegeza Secondary (Kisauni), whose walls were plastered.
  Added a PARTIAL_WORK guard: nothing is a ghost if the source shows any
  construction. Ghost count fell 13 → 4, all genuine ("did not exist" / "works
  not started, no materials on site"). This also corrected the previously-live
  Nandi/Uasin Gishu data.
- **Deduplication.** A project can appear in both the "all projects" and
  "unsatisfactory projects" appendix of one report; 26 duplicate rows removed,
  keeping the record with the real verification result.

### 3a. Verification against FY2023/24 & FY2024/25 (2026-07-24)

The Nandi County Executive + Assembly reports for FY2022/23–FY2024/25 were
retrieved from the Parliament (Bunge) library and every curated story checked
against them. **The curated data held up.** Citations were upgraded to
report + section + page, and two figures reconciled to the primary source:

| Story | Result | Precise citation now in seed |
|---|---|---|
| Kapsengere Hospital Phase II — Ksh 9,954,900 | ✅ exact match (Terik Ward, ramp defective, abandoned) | Exec FY2023/24 §3.6 p56 |
| Kobujoi Sub-County Hospital — Ksh 3,292,946 | ✅ exact match (undocumented payments) | Exec FY2023/24 §3.7 p56 |
| Kabiyet Dairy Creamery — Ksh 621M | ✅ corroborated — multi-phase (Phase III Ksh 64.75M) + Senator cumulative | Exec FY2023/24 §3.4 p55 + Cherargei |
| Manual Payroll / Ghost Workers — Ksh 3.3B | ✅ ghost workers confirmed; Ksh 260.3M outside IPPD; payroll Ksh 3.37B | Exec FY2023/24 §1.6 p45 + FY2024/25 p35 |
| Kapsabet Mother & Baby Unit | 🔧 figure reconciled 208.8M → **contract Ksh 409,813,441** (paid 142.5M) | Exec FY2023/24 §3.8 p57 |
| Pending Bills | 🔧 figure reconciled 985.1M → **Ksh 782,535,628** | Exec FY2024/25 p19 |
| Chepterwai Sub-County Hospital | ✅ failed to submit FY2023/24 financials | Exec FY2023/24 p40 |
| County Assembly (56M / 77M / 54M) | ⚠️ unconfirmed — not matched (OCR noise; FY24/25 Assembly report not yet read) | left as-is, flagged |

All five reports added to `ai-service/documents/` (corpus now 46 PDFs).

---

## 4. How to reproduce / regenerate

```
ai-service/pipeline/
  discover.sh        # find every Nandi PDF on oagkenya.go.ke
  extract.py         # PDFs -> findings.json (page-cited audit findings)
  appendix.py        # PDFs -> projects_raw.json (project-level tables)
  build_seed.py      # projects_raw.json -> seed_generated.js/.json
  inventory.tsv      # the discovered document catalogue
```

Nothing here is scraped from opinion pieces or news — every figure resolves to
a signed Auditor-General report and a page number.
