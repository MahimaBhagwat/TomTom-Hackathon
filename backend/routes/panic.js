const express = require('express');
const router = express.Router();
const panicController = require('../controllers/panicController');

// POST /api/panic - Trigger emergency alert
router.post('/', panicController.triggerPanic);

module.exports = router;

