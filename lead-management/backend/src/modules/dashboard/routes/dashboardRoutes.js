const express = require('express');
const dashboardController = require('../controllers/dashboardController');


const router = express.Router();

// Apply auth and tenant guards to all dashboard endpoints



router.get('/summary', dashboardController.getSummary);
router.get('/lead-funnel', dashboardController.getLeadFunnel);
router.get('/revenue-trend', dashboardController.getRevenueTrend);
router.get('/branch-performance', dashboardController.getBranchPerformance);
router.get('/team-performance', dashboardController.getTeamPerformance);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/upcoming-followups', dashboardController.getUpcomingFollowups);
router.get('/quarterly-performance', dashboardController.getQuarterlyPerformance);

module.exports = router;
