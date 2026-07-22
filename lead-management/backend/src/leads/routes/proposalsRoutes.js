const express = require('express');
const leadController = require('../controllers/leadController');


const router = express.Router();




router.get('/:id', leadController.getProposalById);
router.patch('/:id', leadController.updateProposal);
router.delete('/:id', leadController.deleteProposal);

// Actions
router.post('/:id/approve', leadController.approveProposal);
router.post('/:id/reject', leadController.rejectProposal);
router.post('/:id/sign-contract', leadController.signContract);
router.post('/:id/receive-advance', leadController.receiveAdvance);

module.exports = router;
