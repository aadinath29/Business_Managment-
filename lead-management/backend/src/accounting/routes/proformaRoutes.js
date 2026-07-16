const express = require('express');
const router = express.Router();
const proformaController = require('../controllers/proformaController');

router.post('/', proformaController.createProforma);
router.get('/', proformaController.listProformas);
router.get('/:id', proformaController.getProformaById);
router.put('/:id', proformaController.updateProforma);
router.put('/:id/status', proformaController.updateProformaStatus);
router.delete('/:id', proformaController.deleteProforma);

module.exports = router;
