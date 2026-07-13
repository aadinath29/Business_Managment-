const express = require('express');
const leadController = require('../controllers/leadController');
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

router.get('/:id', leadController.getRequirementById);
router.patch('/:id', leadController.updateRequirement);
router.delete('/:id', leadController.deleteRequirement);

module.exports = router;
