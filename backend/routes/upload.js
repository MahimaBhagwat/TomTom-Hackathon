const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// POST /api/upload/report - Upload photo or audio for reports
router.post('/report', uploadController.uploadReportFile);

// POST /api/upload/panic - Upload panic audio
router.post('/panic', uploadController.uploadPanicAudio);

module.exports = router;

