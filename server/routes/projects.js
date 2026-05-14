import express from 'express';
import Project  from '../models/Project.js';
import Report   from '../models/Report.js';
import { wards, globalStats } from '../data/seed.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const router = express.Router();

// ── GET /api/projects ──────────────────────────────────────────
// Optional query params: ?status=critical | ?ward=kobujoi | ?category=health
router.get('/', async (req, res, next) => {
  try {
    const { status, ward, category } = req.query;
    const filter = {};

    if (ward)     filter.ward     = new RegExp(`^${escapeRegex(ward)}$`, 'i');
    if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');

    // ?status=critical → ghost projects + stalled
    if (status === 'critical') {
      filter.communityStatus = {
        $in: ['GHOST PROJECT', 'STALLED', 'ABANDONED', 'MISALLOCATED'],
      };
    }

    const projects = await Project.find(filter).sort({ communityStatus: 1, allocated: -1 });

    res.json({
      success: true,
      data:    projects,
      total:   projects.length,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/projects/stats ───────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [total, stalled, ghost, abandoned, citizensReporting] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ communityStatus: { $in: ['STALLED', 'ABANDONED'] } }),
      Project.countDocuments({ communityStatus: 'GHOST PROJECT' }),
      Project.countDocuments({ communityStatus: 'ABANDONED' }),
      Report.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        projectsTracked:   total,
        stalledProjects:   stalled,
        ghostProjects:     ghost,
        abandonedProjects: abandoned,
        citizensReporting,
        globalStats,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/projects/wards ───────────────────────────────────
// Returns ward metadata (from seed) merged with live DB counts
router.get('/wards', async (req, res, next) => {
  try {
    // Enrich each ward with live project counts from DB
    const enriched = await Promise.all(
      wards.map(async (ward) => {
        const regex = new RegExp(`^${escapeRegex(ward.name)}$`, 'i');
        const [projectCount, ghostCount, stalledCount] = await Promise.all([
          Project.countDocuments({ ward: regex }),
          Project.countDocuments({ ward: regex, communityStatus: 'GHOST PROJECT' }),
          Project.countDocuments({ ward: regex, communityStatus: { $in: ['STALLED', 'ABANDONED'] } }),
        ]);
        return {
          ...ward,
          projectCount: projectCount || ward.projectCount,
          hasGhost:     ghostCount > 0 || ward.hasGhost,
          stalledCount,
        };
      })
    );

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/projects/map ─────────────────────────────────────
// Lightweight: only coords + status fields needed for map pins
router.get('/map', async (req, res, next) => {
  try {
    const projects = await Project.find(
      { lat: { $ne: null }, lng: { $ne: null } },
      'name ward category allocated year officialStatus communityStatus auditNote lat lng source'
    );

    res.json({ success: true, data: projects, total: projects.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/projects/ward/:wardName ──────────────────────────
router.get('/ward/:wardName', async (req, res, next) => {
  try {
    const regex    = new RegExp(`^${escapeRegex(req.params.wardName)}$`, 'i');
    const wardMeta = wards.find((w) => regex.test(w.name));
    const projects = await Project.find({ ward: regex }).sort({ communityStatus: 1 });

    if (!wardMeta && projects.length === 0) {
      return res.status(404).json({
        success: false,
        error:   `Ward "${req.params.wardName}" not found`,
        code:    'WARD_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        ward:     wardMeta || { name: req.params.wardName },
        projects,
      },
      total: projects.length,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/projects/:id ─────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error:   'Project not found',
        code:    'PROJECT_NOT_FOUND',
      });
    }
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

export default router;
