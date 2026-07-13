const express = require('express');
const leadController = require('../controllers/leadController');
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

router.get('/:id', leadController.getFollowupById);
router.patch('/:id', leadController.updateFollowup);
router.delete('/:id', leadController.deleteFollowup);

module.exports = router;
