const { reportsCollection } = require('../services/firebaseService');

/**
 * POST /api/report
 * Create a safety report
 */
async function createReport(req, res) {
  try {
    const { type, location, description, userId, photoUrl, audioUrl } = req.body;

    if (!type || !location || !location.lat || !location.lon) {
      return res.status(400).json({ 
        error: 'Type and location (lat, lon) are required',
        example: {
          type: 'incident',
          location: { lat: 40.7128, lon: -74.0060 },
          description: 'Suspicious activity',
          userId: 'user123'
        }
      });
    }

    const report = {
      type: type, // 'incident', 'hazard', 'suspicious', etc.
      location: {
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon)
      },
      description: description || '',
      userId: userId || 'anonymous',
      photoUrl: photoUrl || null,
      audioUrl: audioUrl || null,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    };

    // Add to Firestore
    const docRef = await reportsCollection.add(report);

    res.status(201).json({
      success: true,
      id: docRef.id,
      report: {
        ...report,
        id: docRef.id,
        timestamp: report.timestamp.toISOString(),
        expiresAt: report.expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ 
      error: 'Failed to create report',
      message: error.message 
    });
  }
}

/**
 * GET /api/report
 * Get all active (not expired) reports
 */
async function getReports(req, res) {
  try {
    const now = new Date();
    
    // Get all reports that haven't expired
    const reportsSnapshot = await reportsCollection
      .where('expiresAt', '>', now)
      .orderBy('expiresAt', 'desc')
      .get();

    const reports = [];
    reportsSnapshot.forEach(doc => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt
      });
    });

    res.json({
      success: true,
      count: reports.length,
      reports
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reports',
      message: error.message 
    });
  }
}

module.exports = {
  createReport,
  getReports
};

