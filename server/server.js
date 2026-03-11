import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import projectsRouter from './routes/projects.js';
import reportsRouter from './routes/reports.js';
import auditRouter from './routes/audit.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Macho ya Mwananchi API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
