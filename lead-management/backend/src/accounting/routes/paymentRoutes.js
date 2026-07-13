const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.delete('/:id', paymentController.deletePayment);

module.exports = router;
