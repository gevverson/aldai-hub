import express  from 'express';
import multer   from 'multer';
import path     from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { body, validationResult } from 'express-validator';
import sharp        from 'sharp';
import Verification from '../models/Verification.js';
import Project      from '../models/Project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const router     = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../uploads');
await mkdir(UPLOADS_DIR, { recursive: true });

// ── Codenames — anonymous identity for verifiers ──────────────
const CODENAMES = [
  'Simba', 'Tembo', 'Twiga', 'Chui', 'Kifaru', 'Nyati', 'Mbogo', 'Tai',
  'Korongo', 'Fisi', 'Kuro', 'Pundamilia', 'Swala', 'Duma', 'Nguruwe',
  'Nungunungu', 'Nguchiro', 'Buni', 'Mbuni', 'Njiwa',
];
const codename = () => CODENAMES[Math.floor(Math.random() * CODENAMES.length)];

// ── Location privacy — coarsen stored coordinates ─────────────
// A verification is submitted from where the citizen is standing, which for a
// site visit is usually where they *were*, and sometimes near where they live.
// Full-precision coordinates attached to a public, mappable record are enough
// to identify a person in a small community — and the people using this
// platform are reporting on powerful local interests.
//
// So we keep the evidence and drop the precision: coordinates are rounded to
// 3 decimal places (~111 m at the equator) before storage. That is ample for
// plotting a project on a map and for the consensus engine, which reasons over
// which project a verification belongs to, not over metres.
//
// The proximity evidence is NOT lost: the client computes `distanceFromSite`
// against the project's own coordinates at full precision before submitting,
// and that number is stored as-is. We coarsen where the citizen was, not how
// close to the site they got.
const COORD_DECIMALS = 3;
const coarsen = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const factor = 10 ** COORD_DECIMALS;
  return Math.round(n * factor) / factor;
};

// ── Multer — disk storage, images only ───────────────────────
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
  'image/gif':  '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    cb(null, `verify-${suffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits:     { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Only image files are accepted'));
  },
});

// ── Consensus engine ──────────────────────────────────────────
// Runs after every new verification. Updates project communityStatus
// if citizen consensus crosses defined thresholds.
const CONSENSUS_WINDOW_DAYS = 90;

const runConsensus = async (projectId) => {
  const since = new Date();
  since.setDate(since.getDate() - CONSENSUS_WINDOW_DAYS);

  const verifications = await Verification.find({
    projectId,
    createdAt: { $gte: since },
  });

  if (verifications.length === 0) return;

  // Count by status
  const counts = verifications.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const total         = verifications.length;
  const ghostCount    = counts['CONFIRMS_GHOST']   || 0;
  const stalledCount  = counts['CONFIRMS_STALLED'] || 0;

  let newStatus = null;

  // 3+ ghost confirmations → GHOST PROJECT — Community Confirmed
  if (ghostCount >= 3 && ghostCount / total >= 0.6) {
    newStatus = 'GHOST PROJECT';
    console.log(`[CONSENSUS] 🚨 ${projectId} → GHOST PROJECT (${ghostCount}/${total} confirmations)`);
  }
  // 5+ stalled confirmations → STALLED — Community Confirmed
  else if (stalledCount >= 5 && stalledCount / total >= 0.6) {
    newStatus = 'STALLED';
    console.log(`[CONSENSUS] ⚠️  ${projectId} → STALLED (${stalledCount}/${total} confirmations)`);
  }

  if (newStatus) {
    await Project.findByIdAndUpdate(projectId, {
      communityStatus: newStatus,
      $set: { [`verificationMeta.lastConsensus`]: new Date() },
    });
  }
};

// ── Validation rules ──────────────────────────────────────────
const submitRules = [
  body('projectId')   .notEmpty().withMessage('projectId is required'),
  body('lat')         .isFloat({ min: -90,  max: 90  }).withMessage('Invalid latitude'),
  body('lng')         .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('description') .trim().notEmpty().isLength({ max: 500 })
    .withMessage('Description required (max 500 chars)'),
  body('status')      .isIn(['CONFIRMS_GHOST', 'CONFIRMS_STALLED', 'CONFIRMS_COMPLETE', 'DISPUTES_OFFICIAL'])
    .withMessage('Invalid status value'),
];

// ── POST /api/verifications ───────────────────────────────────
router.post('/', upload.single('photo'), submitRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error:   errors.array().map((e) => e.msg).join('; '),
        code:    'VALIDATION_ERROR',
      });
    }

    const {
      projectId, projectName, ward,
      lat, lng,
      description, status,
      locationVerified, distanceFromSite, gpsSource,
    } = req.body;

    // Strip EXIF from uploaded photo — fulfils the privacy promise in the UI.
    // sharp strips all metadata by default (no .withMetadata()).
    // .rotate() preserves visual orientation based on the EXIF value before discarding it.
    if (req.file) {
      try {
        const stripped = await sharp(req.file.path).rotate().toBuffer();
        await writeFile(req.file.path, stripped);
      } catch (exifErr) {
        console.warn(`[VERIFY] EXIF strip warning for ${req.file.filename}: ${exifErr.message}`);
        // Non-fatal — continue without blocking the submission
      }
    }

    const verification = new Verification({
      projectId,
      projectName:      projectName || '',
      ward:             ward        || '',
      // Coarsened to a ~111 m grid — see COORD_DECIMALS above.
      lat:              coarsen(lat),
      lng:              coarsen(lng),
      description:      description.trim(),
      photoUrl:         req.file ? `/uploads/${req.file.filename}` : null,
      verifierCodename: codename(),
      status,
      locationVerified: locationVerified === 'true' || locationVerified === true,
      distanceFromSite: distanceFromSite ? parseInt(distanceFromSite, 10) : null,
      gpsSource:        gpsSource || 'unavailable',
    });

    await verification.save();

    // Fire consensus engine asynchronously — don't block the response
    runConsensus(projectId).catch((err) => {
      console.error(`[CONSENSUS] Error for ${projectId}: ${err.message}`);
    });

    res.status(201).json({
      success:      true,
      data:         verification,
      message:      'Uthibitisho umewasilishwa. Asante kwa ujasiri wako!',
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/verifications/map ────────────────────────────────
// Lightweight endpoint for map pins — all verifications with coords
router.get('/map', async (req, res, next) => {
  try {
    const verifications = await Verification
      .find({})
      .select('projectId projectName ward lat lng status locationVerified verifierCodename photoUrl createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: verifications, total: verifications.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/verifications/recent ────────────────────────────
// Latest 5 — for AlertTicker and Navbar
router.get('/recent', async (req, res, next) => {
  try {
    const recent = await Verification
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('projectName ward status locationVerified verifierCodename photoUrl createdAt');

    res.json({ success: true, data: recent, total: recent.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/verifications/:projectId ────────────────────────
// All verifications for a specific project + consensus summary
router.get('/:projectId', async (req, res, next) => {
  try {
    const verifications = await Verification
      .find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 });

    // Build status summary for the frontend consensus display
    const summary = verifications.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});

    const locationVerifiedCount = verifications.filter((v) => v.locationVerified).length;

    res.json({
      success: true,
      data:    verifications,
      total:   verifications.length,
      meta: {
        statusSummary:        summary,
        locationVerifiedCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
