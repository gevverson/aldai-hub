import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db.js';
import projectsRouter from './routes/projects.js';
import reportsRouter from './routes/reports.js';
import auditRouter from './routes/audit.js';
import verificationsRouter from './routes/verifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded photos as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/verifications', verificationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Macho ya Mwananchi API is running 🇰🇪' });
});

app.listen(PORT, () => {
  console.log(`\n🦅 Macho ya Mwananchi server running on port ${PORT}`);
  console.log(`   "Ukweli ni nguvu." — The truth is power.\n`);
});
