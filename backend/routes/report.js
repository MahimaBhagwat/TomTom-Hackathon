const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// POST /api/report - Create a safety report
router.post('/', reportController.createReport);

// GET /api/report - Get all active reports
router.get('/', reportController.getReports);

module.exports = router;

