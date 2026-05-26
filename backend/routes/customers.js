/**
 * @fileoverview Customer routes module.
 * Mounts customer-related CRUD endpoints and bulk CSV imports.
 */

const express = require('express');
const multer = require('multer');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomers,
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

// Set up multer memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Please upload a valid CSV file.'), false);
    }
  },
});

const router = express.Router();

// Apply protection middleware to all customer endpoints
router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.post('/import', upload.single('file'), importCustomers);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
