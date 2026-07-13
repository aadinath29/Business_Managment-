const express = require('express');
const deliveryCSController = require('../controllers/deliveryCSController');
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

// Standalone Delivery CRUD
router.get('/', deliveryCSController.listDeliveries);
router.patch('/:id', deliveryCSController.updateDelivery);
router.delete('/:id', deliveryCSController.deleteDelivery);

module.exports = router;
