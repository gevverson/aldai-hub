# Security Policy

Macho ya Mwananchi publishes audit findings about public spending and accepts
anonymous reports from citizens. A vulnerability here can expose someone who
took a real risk to submit information. We treat reports accordingly.

## Reporting a vulnerability

**Email: gevversonkipkoech83@gmail.com** with `SECURITY` in the subject line.

**Please do not open a public GitHub issue for a security problem.** A public
issue is visible to everyone, including anyone who would misuse it, for as long
as it takes us to respond.

Preferably include:

- what the problem is and roughly how severe you think it is
- the steps to reproduce it, or the request/URL involved
- what an attacker could obtain or do with it
- anything we should avoid doing while we fix it

You do not need a working exploit, and please do not develop one against the
live site — see the boundaries below.

### What to expect

| | |
|---|---|
| Acknowledgement | within **72 hours** |
| Initial assessment | within **7 days** |
| Fix or mitigation for a confirmed high-severity issue | as fast as we can, target **14 days** |

This project is maintained by one person. If you have not heard back in 72
hours, please send a follow-up — it means the mail was missed, not ignored.

We will tell you when the issue is fixed, and we are glad to credit you by name
in the commit and release notes. If you would rather stay anonymous, say so and
we will not name you.

## Scope

**In scope**

- The three deployed services:
  - `macho-ya-mwananchi-client.onrender.com`
  - `macho-ya-mwananchi-server.onrender.com`
  - `macho-ya-mwananchi-ai.onrender.com`
- This repository — application code, CI workflows, Docker and Render config

Issues we especially want to hear about, given what this platform does:

- **Anything that could de-anonymise a citizen report or verification** —
  submitted content, tracking codes, upload metadata, log leakage, timing or
  ordering side channels
- **Anything that lets the AI answer from outside the indexed OAG corpus**, or
  that lets a user inject content into an answer. Fabricated audit claims are a
  security problem for this project, not merely a quality one.
- Authentication or authorisation gaps on admin routes (`/api/audit/ingest`)
- NoSQL injection, SSRF, XSS, path traversal, or upload handling flaws
- Anything that allows modification of published audit figures

**Out of scope**

- The upstream OAG and Parliament websites, and Render, MongoDB Atlas, or Google
  as service providers — report those to their owners
- Denial of service, volumetric or stress testing against the live services
- Missing hardening headers with no demonstrated impact
- Automated scanner output with no verified exploitability
- Disputes about the *content* of an audit finding — that is a **correction**
  request, not a vulnerability. Use the corrections address in the README.

## Testing boundaries

If you are investigating, please:

- **do not** access, modify, or delete data belonging to other people — a
  citizen report is someone's evidence
- **do not** run denial-of-service or high-volume automated testing; the
  services run on a free tier and go down for real users
- use your own test submissions, and tell us the tracking codes so we can clean
  them up
- stop as soon as you have confirmed a vulnerability exists, and report it

We will not pursue or support legal action against anyone who follows this
policy in good faith. We cannot offer a paid bounty — this is an unfunded civic
project — but we will credit you.

## Supported versions

The deployed `main` branch is the only supported version. Fixes ship to `main`
and auto-deploy; there are no maintained release branches.

## Handling of citizen data

For context when assessing a report — the current design:

- Reports are submitted **without accounts**; no name, email, or phone is
  collected. Submitters receive a cryptographically generated tracking code.
- Production request logs use morgan `tiny`, which records no client IP address,
  and vault routes are excluded from logging entirely.
- EXIF metadata — including embedded GPS — is stripped from every uploaded photo
  before storage.
- **Known limitation:** verification coordinates submitted by a citizen are
  stored at full precision. Coarsening them to a privacy grid is on the roadmap
  and is not yet implemented. If you are assessing de-anonymisation risk, assume
  full-precision coordinates today.

We would rather document that gap here than have you discover it in production.
