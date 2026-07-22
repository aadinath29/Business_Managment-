const express = require('express');
const deliveryCSController = require('../controllers/deliveryCSController');


const router = express.Router();




// Standalone Delivery CRUD
router.get('/', deliveryCSController.listDeliveries);
router.patch('/:id', deliveryCSController.updateDelivery);
router.delete('/:id', deliveryCSController.deleteDelivery);

module.exports = router;
