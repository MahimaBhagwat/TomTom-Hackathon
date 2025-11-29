const { calculateISC } = require('../services/safetyService');

/**
 * GET /api/zone-status
 * Get zone safety level (green / yellow / red)
 */
async function getZoneStatus(req, res) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required',
        example: '/api/zone-status?lat=40.7128&lon=-74.0060'
      });
    }

    const location = {
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };

    const segment = {
      center: location,
      start: location,
      end: location
    };

    // Calculate ISC for this location
    const iscResult = await calculateISC(segment);
    const isc = iscResult.isc;

    // Determine zone status
    let status = 'green';
    if (isc < 0.4) {
      status = 'red'; // Unsafe
    } else if (isc < 0.6) {
      status = 'yellow'; // Caution
    }

    res.json({
      success: true,
      location,
      isc: isc.toFixed(3),
      status,
      breakdown: iscResult.breakdown,
      message: status === 'red' 
        ? 'Unsafe area - proceed with caution' 
        : status === 'yellow' 
        ? 'Moderate safety - stay alert'
        : 'Safe area'
    });

  } catch (error) {
    console.error('Error getting zone status:', error);
    res.status(500).json({ 
      error: 'Failed to get zone status',
      message: error.message 
    });
  }
}

module.exports = {
  getZoneStatus
};