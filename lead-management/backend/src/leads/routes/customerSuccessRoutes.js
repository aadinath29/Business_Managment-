const express = require('express');
const deliveryCSController = require('../controllers/deliveryCSController');


const router = express.Router();




// Standalone Customer Success CRUD
router.get('/', deliveryCSController.listCS);
router.patch('/:id', deliveryCSController.updateCustomerSuccess);
router.delete('/:id', deliveryCSController.deleteCustomerSuccess);

module.exports = router;
