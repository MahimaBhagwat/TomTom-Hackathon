const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');

// GET /api/zone-status - Get zone safety level
router.get('/', zoneController.getZoneStatus);

module.exports = router;

