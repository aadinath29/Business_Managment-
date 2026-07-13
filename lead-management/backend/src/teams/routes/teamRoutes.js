const express = require('express');
const teamController = require('../controllers/teamController');
const { authenticate, authorize, tenantGuard } = require('../../auth/middlewares/authMiddleware');
const { ROLES } = require('../../auth/constants/authConstants');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

// ==========================================
// 1. TEAM ROUTES
// ==========================================

// GET /api/v1/teams/statistics (Super Admin & Admin only)
// Note: Must be declared BEFORE GET /teams/:id
router.get(
  '/teams/statistics',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.getTeamStats
);

// POST /api/v1/teams (Super Admin & Admin only)
router.post(
  '/teams',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.createTeam
);

// GET /api/v1/teams (Super Admin, Admin, Team Leader)
router.get(
  '/teams',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeams
);

// GET /api/v1/teams/:id (Super Admin, Admin, Team Leader)
router.get(
  '/teams/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamById
);

// PATCH /api/v1/teams/:id (Super Admin & Admin only)
router.patch(
  '/teams/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.updateTeam
);

// DELETE /api/v1/teams/:id (Super Admin & Admin only)
router.delete(
  '/teams/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.deleteTeam
);


// ==========================================
// 2. TEAM LEADER & ASSIGNMENT ROUTES
// ==========================================

// POST /api/v1/team-leaders (Super Admin & Admin only)
router.post(
  '/team-leaders',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.createTeamLeader
);

// GET /api/v1/team-leaders (Super Admin, Admin, Team Leader)
router.get(
  '/team-leaders',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamLeaders
);

// GET /api/v1/team-leaders/:id (Super Admin, Admin, Team Leader)
router.get(
  '/team-leaders/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamLeaderById
);

// PATCH /api/v1/team-leaders/:id (Super Admin & Admin only)
router.patch(
  '/team-leaders/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.updateTeamLeader
);

// DELETE /api/v1/team-leaders/:id (Super Admin & Admin only)
router.delete(
  '/team-leaders/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.deleteTeamLeader
);

// POST /api/v1/team-leaders/:teamLeaderId/developers (Super Admin & Admin only)
router.post(
  '/team-leaders/:teamLeaderId/developers',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  teamController.assignDevelopers
);

// GET /api/v1/team-leaders/:id/developers (Super Admin, Admin, Team Leader)
router.get(
  '/team-leaders/:id/developers',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getDevelopers
);

// GET /api/v1/team-leaders/:id/performance (Super Admin, Admin, Team Leader)
router.get(
  '/team-leaders/:id/performance',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamPerformance
);

// GET /api/v1/team-leaders/:id/dashboard-stats (Super Admin, Admin, Team Leader)
router.get(
  '/team-leaders/:id/dashboard-stats',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER),
  teamController.getTeamDashboardStats
);

module.exports = router;
