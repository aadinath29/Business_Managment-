const express = require('express');
const router = express.Router();
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

// Import individual route modules
const quotationRoutes = require('./quotationRoutes');
const proformaRoutes = require('./proformaRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const paymentRoutes = require('./paymentRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Apply authentication and tenant isolation globally to all accounting routes
router.use(authenticate, tenantGuard);

// Register sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/quotations', quotationRoutes);
router.use('/proformas', proformaRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
