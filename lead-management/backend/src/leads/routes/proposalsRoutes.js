const express = require('express');
const leadController = require('../controllers/leadController');
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

router.get('/:id', leadController.getProposalById);
router.patch('/:id', leadController.updateProposal);
router.delete('/:id', leadController.deleteProposal);

// Actions
router.post('/:id/approve', leadController.approveProposal);
router.post('/:id/reject', leadController.rejectProposal);
router.post('/:id/sign-contract', leadController.signContract);
router.post('/:id/receive-advance', leadController.receiveAdvance);

module.exports = router;
