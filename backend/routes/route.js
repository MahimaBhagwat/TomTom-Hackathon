const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// POST /api/route/safest
router.post('/safest', routeController.findSafestRoute);

module.exports = router;