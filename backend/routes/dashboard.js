/**
 * @fileoverview Dashboard routes module.
 * Mounts endpoints to get high-level metrics and time-series chart data.
 */

const express = require('express');
const { getStats, getChartData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection to dashboard analytic endpoints
router.use(protect);

router.get('/stats', getStats);
router.get('/chart-data', getChartData);

module.exports = router;
