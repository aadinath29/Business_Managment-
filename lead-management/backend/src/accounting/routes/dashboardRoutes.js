const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/accounting/dashboard
router.get('/', dashboardController.getAccountingDashboard);

module.exports = router;
