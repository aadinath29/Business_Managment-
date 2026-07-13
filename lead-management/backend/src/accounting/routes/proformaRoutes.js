const express = require('express');
const router = express.Router();
const proformaController = require('../controllers/proformaController');

router.post('/', proformaController.createProforma);
router.get('/', proformaController.listProformas);
router.get('/:id', proformaController.getProformaById);
router.put('/:id/status', proformaController.updateProformaStatus);

module.exports = router;
