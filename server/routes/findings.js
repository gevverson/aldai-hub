import express from 'express';
import Finding from '../models/Finding.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const router = express.Router();

// ── GET /api/findings ─────────────────────────────────────────
// Filter by ?county= and/or ?constituency= and/or ?year=.
// Sorted so the largest flagged amounts surface first.
router.get('/', async (req, res, next) => {
  try {
    const { county, constituency, year } = req.query;
    const filter = {};
    if (county)       filter.county       = new RegExp(`^${escapeRegex(county)}$`, 'i');
    if (constituency) filter.constituency = new RegExp(`^${escapeRegex(constituency)}$`, 'i');
    if (year)         filter.year         = year;

    const findings = await Finding.find(filter).sort({ amountKsh: -1, year: -1 });
    res.json({ success: true, data: findings, total: findings.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/findings/summary/:constituency ───────────────────
// Opinion timeline + flagged total for a constituency — powers the
// audit-findings header on the constituency page.
router.get('/summary/:constituency', async (req, res, next) => {
  try {
    const regex = new RegExp(`^${escapeRegex(req.params.constituency)}$`, 'i');
    const findings = await Finding.find({ constituency: regex });

    const opinions = {};
    let flaggedTotal = 0;
    for (const f of findings) {
      if (f.opinion) opinions[f.year] = f.opinion;
      if (f.amountKsh) flaggedTotal += f.amountKsh;
    }

    res.json({
      success: true,
      data: {
        constituency: req.params.constituency,
        findingCount: findings.length,
        flaggedTotal,
        opinionsByYear: opinions,
        years: [...new Set(findings.map((f) => f.year))].sort(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
