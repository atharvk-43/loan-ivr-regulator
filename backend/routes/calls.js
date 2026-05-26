/**
 * @fileoverview Call routes module.
 * Mounts endpoints to trigger outbound IVR calls and view history.
 */

const express = require('express');
const {
  startCall,
  retryCall,
  getCallHistory,
  getCustomerLogs,
} = require('../controllers/callController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all call history and trigger endpoints
router.use(protect);

router.post('/start/:customerId', startCall);
router.post('/retry/:customerId', retryCall);
router.get('/history', getCallHistory);
router.get('/:customerId/logs', getCustomerLogs);

module.exports = router;
