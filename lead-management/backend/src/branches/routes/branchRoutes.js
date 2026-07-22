const express = require('express');
const branchController = require('../controllers/branchController');
const { authorize } = require('../../auth/middlewares/authMiddleware');
const { ROLES } = require('../../auth/constants/authConstants');

const router = express.Router();

// Route mapping
// Branch lifecycle (create/delete): Super Admin only.
// Update: Super Admin + Branch Manager (service enforces own-branch ownership).
router.post('/', authorize(ROLES.SUPER_ADMIN), branchController.createBranch);
router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranchById);
router.patch('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), branchController.updateBranch);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN), branchController.deleteBranch);

// Quarterly Targets
router.get('/:id/quarterly-targets', branchController.getQuarterlyTargets);
router.put('/:id/quarterly-targets', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), branchController.updateQuarterlyTargets);

module.exports = router;
