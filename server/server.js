import express      from 'express';
import cors         from 'cors';
import helmet       from 'helmet';
import rateLimit    from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan       from 'morgan';
import dotenv       from 'dotenv';
import path         from 'path';
import { fileURLToPath } from 'url';

import connectDB          from './db.js';
import projectsRouter     from './routes/projects.js';
import geographyRouter    from './routes/geography.js';
import reportsRouter      from './routes/reports.js';
import auditRouter, { validateAuditConfig } from './routes/audit.js';
import verificationsRouter from './routes/verifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const app        = express();
const PORT       = process.env.PORT || 3001;
const IS_PROD    = process.env.NODE_ENV === 'production';

// ── Trust Render/Cloudflare proxy so rate-limiter sees real user IPs ──────────
// Without this, every browser request through the CDN looks like it comes from
// the same CDN IP — all users share one rate-limit bucket and hit it instantly.
app.set('trust proxy', 1);

try {
  const { warnings } = validateAuditConfig({ strict: IS_PROD });
  warnings.forEach((warning) => console.warn(`[CONFIG] ${warning}`));
} catch (err) {
  console.error(`[CONFIG] ${err.message}`);
  process.exit(1);
}

// ── Database ─────────────────────────────────────────────────
connectDB();

// ── Security headers (helmet) ─────────────────────────────────
// Disable contentSecurityPolicy in dev so Vite HMR works
app.use(helmet({ contentSecurityPolicy: IS_PROD }));

// ── CORS ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin (no origin header) and configured origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Request logging ───────────────────────────────────────────
// Skip vault routes entirely — whistleblower safety
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(IS_PROD ? 'tiny' : 'dev', {
    skip: (req) => req.path.startsWith('/api/vault'),
  }));
}

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── NoSQL injection prevention ────────────────────────────────
app.use(mongoSanitize());

// ── Rate limiters ─────────────────────────────────────────────

// Bypass rate limiting only when explicitly enabled (hermetic E2E / CI).
// Unset in production, so live behaviour is unchanged.
const skipRateLimit = () => process.env.DISABLE_RATE_LIMIT === '1';

// General: all /api routes — 100 req / 15 min / IP
const generalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipRateLimit,
  message: {
    success: false,
    error:   'Maombi mengi sana. Jaribu tena baada ya dakika 15.',
    code:    'RATE_LIMIT',
  },
});

// Reports POST: 5 submissions / hour / IP
const reportSubmitLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipRateLimit,
  message: {
    success: false,
    error:   'Umefika kikomo cha ripoti. Jaribu tena baada ya saa moja.',
    code:    'RATE_LIMIT_REPORTS',
  },
});

// Verifications POST: 10 submissions / hour / IP
const verifySubmitLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipRateLimit,
  message: {
    success: false,
    error:   'Umefika kikomo cha uthibitisho. Jaribu tena baada ya saa moja.',
    code:    'RATE_LIMIT_VERIFY',
  },
});

// Apply general limiter to all API routes
app.use('/api', generalLimiter);

// Apply submit-specific limiters only on POST
app.post('/api/reports',        reportSubmitLimiter);
app.post('/api/verifications',  verifySubmitLimiter);

// ── Static file serving ───────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/projects',       projectsRouter);
app.use('/api/geography',      geographyRouter);
app.use('/api/reports',        reportsRouter);
app.use('/api/audit',          auditRouter);
app.use('/api/verifications',  verificationsRouter);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:   true,
    status:    'ok',
    uptime:    Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    db:        'connected',
    env:       process.env.NODE_ENV || 'development',
  });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error:   `Route not found: ${req.method} ${req.path}`,
    code:    'NOT_FOUND',
  });
});

// ── Global error handler ──────────────────────────────────────
// Must be last, must have 4 params
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`);
  if (!IS_PROD) console.error(err.stack);

  // CORS errors
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ success: false, error: err.message, code: 'CORS_ERROR' });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join('; '), code: 'VALIDATION_ERROR' });
  }

  // Mongoose cast errors (bad ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format', code: 'INVALID_ID' });
  }

  res.status(err.status || 500).json({
    success: false,
    error:   IS_PROD ? 'Hitilafu ya seva. Tafadhali jaribu tena.' : err.message,
    code:    err.code || 'SERVER_ERROR',
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🦅 Macho ya Mwananchi server running on port ${PORT}`);
  console.log(`   Mode:     ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS:     ${ALLOWED_ORIGINS.join(', ')}`);
  console.log('   "Ukweli ni nguvu." — The truth is power.\n');
});
