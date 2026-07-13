const express = require('express');
const leadController = require('../controllers/leadController');
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

router.get('/:id', leadController.getCommunicationById);
router.patch('/:id', leadController.updateCommunication);
router.delete('/:id', leadController.deleteCommunication);

module.exports = router;
