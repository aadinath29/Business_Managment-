const express = require('express');
const deliveryCSController = require('../controllers/deliveryCSController');
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

// Standalone Customer Success CRUD
router.get('/', deliveryCSController.listCS);
router.patch('/:id', deliveryCSController.updateCustomerSuccess);
router.delete('/:id', deliveryCSController.deleteCustomerSuccess);

module.exports = router;
