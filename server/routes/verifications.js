import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Verification from '../models/Verification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Animal codenames for anonymous citizens
const CODENAMES = [
  'Simba', 'Tembo', 'Twiga', 'Chui', 'Kifaru', 'Nyati', 'Mbogo', 'Tai',
  'Korongo', 'Nzige', 'Kanguro', 'Fisi', 'Ngo', 'Kuro', 'Pundamilia',
];

const getRandomCodename = () => CODENAMES[Math.floor(Math.random() * CODENAMES.length)];

// Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `verify-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are accepted'), false);
    }
  },
});

// POST /api/verifications — Submit photo + GPS evidence
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { projectId, projectName, ward, lat, lng, description, status } = req.body;

    if (!projectId || !lat || !lng || !description || !status) {
      return res.status(400).json({ error: 'projectId, lat, lng, description, status are required' });
    }

    const verification = new Verification({
      projectId,
      projectName,
      ward,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      description,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      verifierCodename: getRandomCodename(),
      status,
    });

    await verification.save();

    res.status(201).json({ success: true, verification });
  } catch (error) {
    console.error('[VERIFICATIONS] POST error:', error);
    res.status(500).json({ error: 'Failed to save verification' });
  }
});

// GET /api/verifications/map — All verifications (lightweight, for map pins)
router.get('/map', async (req, res) => {
  try {
    const verifications = await Verification.find({}).select(
      'projectId projectName ward lat lng status verifierCodename photoUrl createdAt'
    ).sort({ createdAt: -1 });
    res.json(verifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/verifications/recent — Latest 5 verifications for the alert ticker
router.get('/recent', async (req, res) => {
  try {
    const recent = await Verification.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('projectName ward status verifierCodename photoUrl createdAt');
    res.json(recent);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/verifications/:projectId — All verifications for a specific project
router.get('/:projectId', async (req, res) => {
  try {
    const verifications = await Verification.find({ projectId: req.params.projectId }).sort({
      createdAt: -1,
    });
    res.json(verifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
