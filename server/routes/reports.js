import express from 'express';
import Report from '../models/Report.js';

const router = express.Router();

// GET /api/reports/today-count — Navbar live indicator
// Must be declared BEFORE '/:code' to avoid route shadowing
router.get('/today-count', async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await Report.countDocuments({ createdAt: { $gte: start } });
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

// GET /api/reports — returns array directly so Array.isArray() works on frontend
router.get('/', async (req, res) => {
  try {
    const { ward, limit = 20, sort = 'newest' } = req.query;
    const filter = ward ? { ward } : {};
    const sortDir = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 };
    const docs = await Report.find(filter).sort(sortDir).limit(Number(limit));

    // Transform to match frontend field expectations
    const reports = docs.map((d) => ({
      _id:        d._id,
      ward:       d.ward,
      category:   d.issueType,   // frontend uses 'category'
      text:       d.description, // frontend uses 'text'
      verifiedBy: 0,             // no peer-verification for anonymous reports yet
      createdAt:  d.createdAt,
    }));

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports — anonymous submission
router.post('/', async (req, res) => {
  try {
    const { category, ward, description } = req.body;

    if (!ward || !description) {
      return res.status(400).json({ error: 'ward and description are required' });
    }

    const trackingCode =
      'NANDI-' + new Date().getFullYear() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const report = new Report({
      ward,
      issueType:    category || 'other',
      description,
      reportId:     'RPT-' + Date.now(),
      trackingCode,
      status:       'RECEIVED',
    });

    await report.save();

    res.status(201).json({
      success:      true,
      trackingCode,
      message:      'Ripoti imetumwa. Asante kwa ujasiri wako!',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/track/:code
router.get('/track/:code', async (req, res) => {
  try {
    const report = await Report.findOne({ trackingCode: req.params.code });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true, data: { status: report.status, code: report.trackingCode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
