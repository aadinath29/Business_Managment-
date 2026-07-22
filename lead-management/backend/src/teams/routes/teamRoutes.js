const express = require('express');
const teamController = require('../controllers/teamController');
const { authorize } = require('../../auth/middlewares/authMiddleware');
const { ROLES } = require('../../auth/constants/authConstants');

const router = express.Router();

// ==========================================
// 1. TEAM ROUTES
// ==========================================

// GET /api/v1/teams/statistics (Super Admin & Admin only)
// Note: Must be declared BEFORE GET /teams/:id
router.get(
  '/statistics',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.getTeamStats
);

// POST /api/v1/teams (Super Admin & Admin only)
router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.createTeam
);

// GET /api/v1/teams (Super Admin, Admin, Team Leader)
router.get(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeams
);

// GET /api/v1/teams/:id (Super Admin, Admin, Team Leader)
router.get(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamById
);

// PATCH /api/v1/teams/:id (Super Admin & Admin only)
router.patch(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.updateTeam
);

// DELETE /api/v1/teams/:id (Super Admin & Admin only)
router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.deleteTeam
);

module.exports = router;
