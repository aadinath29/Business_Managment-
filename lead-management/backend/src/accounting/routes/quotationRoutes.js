const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');

router.post('/', quotationController.createQuotation);
router.get('/', quotationController.listQuotations);
router.get('/:id', quotationController.getQuotationById);
router.put('/:id', quotationController.updateQuotation);
router.post('/:id/revise', quotationController.reviseQuotation);

module.exports = router;
