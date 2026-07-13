const express = require('express');
const branchController = require('../controllers/branchController');
const { authenticate, authorize, tenantGuard } = require('../../auth/middlewares/authMiddleware');
const { ROLES } = require('../../auth/constants/authConstants');

const router = express.Router();

// Apply authenticate and tenantGuard to all branch endpoints
router.use(authenticate);
router.use(tenantGuard);

// Route mapping
// Branch lifecycle (create/delete): Super Admin only.
// Update: Super Admin + Branch Manager (service enforces own-branch ownership).
router.post('/', authorize(ROLES.SUPER_ADMIN), branchController.createBranch);
router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranchById);
router.patch('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), branchController.updateBranch);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN), branchController.deleteBranch);

module.exports = router;
