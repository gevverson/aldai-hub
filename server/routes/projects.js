import express from 'express';
import { wards, globalStats, projects as seedProjects } from '../data/seed.js';
import Project from '../models/Project.js';

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({});
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get global stats
router.get('/stats', async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const stalledProjects = await Project.countDocuments({ communityStatus: { $in: ['STALLED', 'ABANDONED'] } });
    const ghostProjects = await Project.countDocuments({ communityStatus: 'GHOST PROJECT' });
    
    res.json({
      projectsTracked: totalProjects,
      stalledProjects: stalledProjects,
      ghostProjects: ghostProjects,
      citizensReporting: 42, // Mock number for MVP
      globalStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get all wards metadata
router.get('/wards', (req, res) => {
  res.json(wards);
});

// Get projects by ward
router.get('/ward/:wardName', async (req, res) => {
  try {
    const wardName = req.params.wardName;
    const filterRegex = new RegExp(`^${wardName}$`, 'i');
    
    const filteredProjects = await Project.find({ ward: filterRegex });
    
    const wardMeta = wards.find(
      w => w.name.toLowerCase() === wardName.toLowerCase()
    );

    res.json({
      ward: wardMeta || { name: wardName },
      projects: filteredProjects
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
