import express from 'express';
import Project from '../models/Project.js';
import Finding from '../models/Finding.js';
import { counties, findCounty } from '../data/geography.js';

const router = express.Router();

// Statuses the auditor recorded as an adverse outcome.
// IRREGULAR was missing from this list, so projects the auditor called
// irregular were counted the same as projects found in good order.
const NEGATIVE = [
  'GHOST PROJECT', 'STALLED', 'ABANDONED', 'INCOMPLETE',
  'DISPUTED', 'MISALLOCATED', 'IRREGULAR',
];

// A project the auditor confirmed in good order. Everything that is neither
// NEGATIVE nor CLEAN — 'REPORTED — SEE NOTE', 'REPORTED — NO VERIFICATION
// RESULT' — was reported but never checked, and must not be scored either way.
const CLEAN = ['COMPLETE'];

/**
 * Audit findings grouped by a field — Map keyed by the grouped value.
 *
 * Deliberately no sum of `amountKsh`. OAG findings are heterogeneous —
 * an unexplained variance, an unsupported balance and a pending bill are
 * not addends — so a total would read as "this much was stolen" while
 * meaning nothing. The count of findings that carry a figure is honest;
 * the figures themselves are shown one by one, each with its citation.
 */
async function findingRollup(match, groupField) {
  const rows = await Finding.aggregate([
    { $match: match },
    {
      $group: {
        _id: `$${groupField}`,
        findingCount: { $sum: 1 },
        findingsWithAmount: {
          $sum: { $cond: [{ $gt: ['$amountKsh', 0] }, 1, 0] },
        },
        findingYears: { $addToSet: '$year' },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id, r]));
}

/**
 * Roll up project stats grouped by a field, in a single aggregation.
 * Returns a Map keyed by the grouped value.
 */
async function rollup(match, groupField) {
  const rows = await Project.aggregate([
    { $match: match },
    {
      $group: {
        _id: `$${groupField}`,
        projectCount: { $sum: 1 },
        totalAllocated: { $sum: '$allocated' },
        ghostCount: {
          $sum: { $cond: [{ $eq: ['$communityStatus', 'GHOST PROJECT'] }, 1, 0] },
        },
        flaggedCount: {
          $sum: { $cond: [{ $in: ['$communityStatus', NEGATIVE] }, 1, 0] },
        },
        flaggedValue: {
          $sum: { $cond: [{ $in: ['$communityStatus', NEGATIVE] }, '$allocated', 0] },
        },
        // Projects that actually carry a verification outcome. The health
        // score divides by this, not by projectCount: 30% of the register has
        // no result, and counting those as "not flagged" silently improved
        // every county's score — Kisii showed 0% flagged and "Mostly Verified"
        // on 15 projects of which not one had been verified.
        verifiedCount: {
          $sum: {
            $cond: [
              { $or: [
                { $in: ['$communityStatus', NEGATIVE] },
                { $in: ['$communityStatus', CLEAN] },
              ] },
              1, 0,
            ],
          },
        },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id, r]));
}

const shape = (stats, finds = null) => ({
  projectCount:   stats?.projectCount   ?? 0,
  totalAllocated: stats?.totalAllocated ?? 0,
  ghostCount:     stats?.ghostCount     ?? 0,
  flaggedCount:   stats?.flaggedCount   ?? 0,
  flaggedValue:   stats?.flaggedValue   ?? 0,
  verifiedCount:  stats?.verifiedCount  ?? 0,
  // Reported in the register but never verified either way. Surfaced so a
  // reader can see how much of the score rests on nothing.
  unverifiedCount: Math.max(0, (stats?.projectCount ?? 0) - (stats?.verifiedCount ?? 0)),
  findingCount:        finds?.findingCount ?? 0,
  findingsWithAmount:  finds?.findingsWithAmount ?? 0,
  findingYears:        [...(finds?.findingYears ?? [])].sort(),
});

// ── GET /api/geography ────────────────────────────────────────
// The full county → constituency tree with live rollup stats.
// This is what powers the "pick a county" drill-down.
router.get('/', async (req, res, next) => {
  try {
    const [byCounty, byConstituency, findCounty_, findConstituency_] = await Promise.all([
      rollup({}, 'county'),
      rollup({ constituency: { $ne: null } }, 'constituency'),
      findingRollup({}, 'county'),
      findingRollup({}, 'constituency'),
    ]);

    const data = counties.map((county) => ({
      name: county.name,
      code: county.code,
      ...shape(byCounty.get(county.name), findCounty_.get(county.name) ?? null),
      constituencies: county.constituencies.map((k) => ({
        name: k.name,
        covered: k.covered,
        ...shape(byConstituency.get(k.name), findConstituency_.get(k.name) ?? null),
      })),
    }));

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/geography/:county ────────────────────────────────
router.get('/:county', async (req, res, next) => {
  try {
    const county = findCounty(req.params.county);
    if (!county) {
      return res.status(404).json({
        success: false,
        error: `County "${req.params.county}" not found`,
        code: 'COUNTY_NOT_FOUND',
      });
    }

    const [byConstituency, countyTotals, findByConstituency, findCountyTotal] = await Promise.all([
      rollup({ county: county.name }, 'constituency'),
      rollup({ county: county.name }, 'county'),
      findingRollup({ county: county.name }, 'constituency'),
      findingRollup({ county: county.name }, 'county'),
    ]);

    res.json({
      success: true,
      data: {
        name: county.name,
        code: county.code,
        ...shape(countyTotals.get(county.name), findCountyTotal.get(county.name) ?? null),
        // A null key holds county-wide (County Executive) projects.
        countyWide: shape(byConstituency.get(null)),
        constituencies: county.constituencies.map((k) => ({
          name: k.name,
          covered: k.covered,
          ...shape(byConstituency.get(k.name), findByConstituency.get(k.name) ?? null),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
