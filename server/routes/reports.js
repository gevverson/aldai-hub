import express from 'express';
import Report from '../models/Report.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { ward, issueType, description } = req.body;
  
  // Basic validation
  if (!ward || !issueType || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // NOTE: In a real app EXIF data is stripped and IP is never logged here.
  try {
    const reportId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const trackingCode = `NANDI-2026-${reportId.substring(0, 4).toUpperCase()}`;
    
    const newReport = await Report.create({
      ward,
      issueType,
      description,
      reportId,
      trackingCode,
      status: 'RECEIVED'
    });

    console.log('New anonymous report received and saved to DB:', newReport.trackingCode);

    // Return generic code for tracking without exposing identity
    res.status(201).json({
      success: true,
      message: 'Report received anonymously.',
      trackingCode: trackingCode
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process report' });
  }
});

export default router;
