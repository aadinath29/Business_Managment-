const express = require('express');
const teamController = require('../controllers/teamController');
const { authorize } = require('../../auth/middlewares/authMiddleware');
const { ROLES } = require('../../auth/constants/authConstants');

const router = express.Router();

// ==========================================
// 2. TEAM LEADER & ASSIGNMENT ROUTES
// ==========================================

// POST /api/v1/team-leaders (Super Admin & Admin only)
router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.createTeamLeader
);

// GET /api/v1/team-leaders (Super Admin, Admin, Team Leader)
router.get(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamLeaders
);

// GET /api/v1/team-leaders/:id (Super Admin, Admin, Team Leader)
router.get(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamLeaderById
);

// PATCH /api/v1/team-leaders/:id (Super Admin & Admin only)
router.patch(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.updateTeamLeader
);

// DELETE /api/v1/team-leaders/:id (Super Admin & Admin only)
router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.deleteTeamLeader
);

// POST /api/v1/team-leaders/:teamLeaderId/developers (Super Admin & Admin only)
router.post(
  '/:teamLeaderId/developers',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.assignDevelopers
);

// GET /api/v1/team-leaders/:id/developers (Super Admin, Admin, Team Leader)
router.get(
  '/:id/developers',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getDevelopers
);

// GET /api/v1/team-leaders/:id/performance (Super Admin, Admin, Team Leader)
router.get(
  '/:id/performance',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamPerformance
);

// GET /api/v1/team-leaders/:id/dashboard-stats (Super Admin, Admin, Team Leader)
router.get(
  '/:id/dashboard-stats',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamDashboardStats
);

module.exports = router;
