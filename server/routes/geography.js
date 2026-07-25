import express from 'express';
import Project from '../models/Project.js';
import Finding from '../models/Finding.js';
import { counties, findCounty } from '../data/geography.js';

const router = express.Router();

const NEGATIVE = ['GHOST PROJECT', 'STALLED', 'ABANDONED', 'INCOMPLETE', 'DISPUTED', 'MISALLOCATED'];

/** Count of audit findings grouped by a field — Map keyed by the grouped value. */
async function findingRollup(match, groupField) {
  const rows = await Finding.aggregate([
    { $match: match },
    { $group: { _id: `$${groupField}`, findingCount: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.findingCount]));
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
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id, r]));
}

const shape = (stats, findingCount = 0) => ({
  projectCount:   stats?.projectCount   ?? 0,
  totalAllocated: stats?.totalAllocated ?? 0,
  ghostCount:     stats?.ghostCount     ?? 0,
  flaggedCount:   stats?.flaggedCount   ?? 0,
  flaggedValue:   stats?.flaggedValue   ?? 0,
  findingCount,
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
      ...shape(byCounty.get(county.name), findCounty_.get(county.name) ?? 0),
      constituencies: county.constituencies.map((k) => ({
        name: k.name,
        covered: k.covered,
        ...shape(byConstituency.get(k.name), findConstituency_.get(k.name) ?? 0),
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
        ...shape(countyTotals.get(county.name), findCountyTotal.get(county.name) ?? 0),
        // A null key holds county-wide (County Executive) projects.
        countyWide: shape(byConstituency.get(null)),
        constituencies: county.constituencies.map((k) => ({
          name: k.name,
          covered: k.covered,
          ...shape(byConstituency.get(k.name), findByConstituency.get(k.name) ?? 0),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
