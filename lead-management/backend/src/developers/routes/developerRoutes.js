const express = require('express');
const developerController = require('../controllers/developerController');
const { authenticate, authorize } = require('../../auth/middlewares/authMiddleware');
const { ROLES } = require('../../auth/constants/authConstants');

const router = express.Router();

// Provision a new developer (Super Admin, Admin, & Team Leader)
router.post(
  '/',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  developerController.createDeveloper
);

// Get list of developers under tenant (Super Admin, Admin, Team Leader, Developer)
router.get(
  '/',
  authenticate,
  developerController.getDevelopers
);

// Get developer details by ID (Super Admin, Admin, Team Leader, Developer - access controls inside service)
router.get(
  '/:id',
  authenticate,
  developerController.getDeveloperById
);

// Get developer full profile view (Super Admin, Admin, Team Leader, Developer - access controls inside service)
router.get(
  '/:id/profile',
  authenticate,
  developerController.getDeveloperProfile
);

// Get developer performance metrics (Super Admin, Admin, Team Leader, Developer - access controls inside service)
router.get(
  '/:id/performance',
  authenticate,
  developerController.getDeveloperPerformance
);

// Update developer details (Super Admin & Admin only)
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  developerController.updateDeveloper
);

// Soft delete developer user profile & account (Super Admin & Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  developerController.deleteDeveloper
);

module.exports = router;
