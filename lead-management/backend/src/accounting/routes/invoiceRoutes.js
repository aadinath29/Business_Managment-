const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const paymentController = require('../controllers/paymentController');

router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.listInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

// Nested routes for Payments attached to an Invoice
router.post('/:id/payments', paymentController.recordPayment);
router.get('/:id/payments', paymentController.listPaymentsForInvoice);

module.exports = router;
