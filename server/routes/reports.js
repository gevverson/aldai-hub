import crypto from 'crypto';
import express from 'express';
import { body, validationResult } from 'express-validator';
import Report from '../models/Report.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const router = express.Router();

const VALID_CATEGORIES = ['stalled', 'ghost', 'health', 'road', 'medicine', 'bursary', 'other'];

const submitRules = [
  body('ward')
    .trim().notEmpty().withMessage('Ward is required'),
  body('description')
    .trim().notEmpty().isLength({ min: 20, max: 1000 })
    .withMessage('Description required (20–1000 characters)'),
  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
];

// ── GET /api/reports/today-count — Navbar live indicator ──────
// Declared BEFORE '/:code' to avoid route shadowing
router.get('/today-count', async (req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await Report.countDocuments({ createdAt: { $gte: start } });
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/reports ──────────────────────────────────────────
// Returns array for frontend Array.isArray() check
router.get('/', async (req, res, next) => {
  try {
    const { ward, limit = 20, sort = 'newest', page = 1 } = req.query;
    const filter  = ward ? { ward: new RegExp(`^${escapeRegex(ward)}$`, 'i') } : {};
    const sortDir = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 };
    const skip    = (Number(page) - 1) * Number(limit);

    // The response is a plain array (see below), so there is nowhere to put a
    // total — don't pay for the count query.
    const docs = await Report.find(filter).sort(sortDir).skip(skip).limit(Number(limit));

    // Transform to match frontend field contract
    const reports = docs.map((d) => ({
      _id:        d._id,
      ward:       d.ward,
      category:   d.issueType,   // frontend uses 'category'
      text:       d.description, // frontend uses 'text'
      verifiedBy: 0,             // placeholder — peer-verification coming in Phase 3
      createdAt:  d.createdAt,
    }));

    res.json(reports); // plain array for Array.isArray() compatibility
  } catch (err) {
    next(err);
  }
});

// ── POST /api/reports — anonymous submission ──────────────────
router.post('/', submitRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error:   errors.array().map((e) => e.msg).join('; '),
        code:    'VALIDATION_ERROR',
      });
    }

    const { category, ward, description } = req.body;

    const trackingCode =
      'NANDI-' + new Date().getFullYear() + '-' +
      crypto.randomBytes(4).toString('hex').toUpperCase();

    const report = new Report({
      ward:         ward.trim(),
      issueType:    category || 'other',
      description:  description.trim(),
      reportId:     crypto.randomUUID(),
      trackingCode,
      status:       'RECEIVED',
    });

    await report.save();

    res.status(201).json({
      success:      true,
      data:         { trackingCode },
      message:      'Ripoti imetumwa. Asante kwa ujasiri wako!',
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/reports/track/:code ──────────────────────────────
router.get('/track/:code', async (req, res, next) => {
  try {
    const report = await Report.findOne({ trackingCode: req.params.code });
    if (!report) {
      return res.status(404).json({
        success: false,
        error:   'Tracking code not found',
        code:    'REPORT_NOT_FOUND',
      });
    }
    res.json({
      success: true,
      data:    { status: report.status, code: report.trackingCode },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
