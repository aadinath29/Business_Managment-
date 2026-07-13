const dashboardRepository = require('../repositories/dashboardRepository');
const { ROLES } = require('../../../auth/constants/authConstants');

// No longer need manual scope overrides; scopeHelper handles it in the repository.

const getSummary = async (tenantId, userId, role, filters) => {
  const data = await dashboardRepository.getSummary(tenantId, filters);
  
  // Calculate rates
  const conversionRate = data.total_leads ? Number((data.won_leads / data.total_leads * 100).toFixed(1)) : 0;
  const conversionRateCurr = data.total_leads_curr ? Number((data.won_leads_curr / data.total_leads_curr * 100).toFixed(1)) : 0;
  const conversionRatePrev = data.total_leads_prev ? Number((data.won_leads_prev / data.total_leads_prev * 100).toFixed(1)) : 0;
  
  const calculatePctTrend = (curr, prev) => {
    const c = Number(curr) || 0;
    const p = Number(prev) || 0;
    if (p === 0) return c > 0 ? 100.0 : 0.0;
    return Number(((c - p) / p * 100).toFixed(1));
  };
  
  const totalLeadsTrend = calculatePctTrend(data.total_leads_curr, data.total_leads_prev);
  const qualifiedLeadsTrend = calculatePctTrend(data.qualified_leads_curr, data.qualified_leads_prev);
  const revenueTrend = calculatePctTrend(data.revenue_curr, data.revenue_prev);
  const conversionRateTrend = Number((conversionRateCurr - conversionRatePrev).toFixed(1));
  
  const summary = {
    totalLeads: data.total_leads,
    qualifiedLeads: data.qualified_leads,
    conversionRate,
    totalRevenue: Number(data.revenue) || 0,
    pipelineValue: Number(data.pipeline_value) || 0,
    closedWon: Number(data.closed_won) || 0,
    trends: {
      totalLeadsTrend,
      qualifiedLeadsTrend,
      conversionRateTrend,
      revenueTrend
    }
  };
  
  // Add role specific metadata
  if (role === ROLES.TEAM_LEADER) {
    const teamId = await dashboardRepository.findTeamLeaderTeamId(userId, tenantId);
    const taskStats = await dashboardRepository.getTaskStats(tenantId, teamId);
    summary.pendingTasks = taskStats.pending;
    summary.completedTasks = taskStats.completed;
  } else if (role === ROLES.DEVELOPER) {
    const devId = await dashboardRepository.findDeveloperId(userId, tenantId);
    if (devId) {
      const taskStats = await dashboardRepository.getDeveloperTaskStats(tenantId, devId);
      summary.pendingTasks = taskStats.pending;
      summary.completedTasks = taskStats.completed;
    } else {
      summary.pendingTasks = 0;
      summary.completedTasks = 0;
    }
  } else if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
    const activeBranchId = filters.branchId;
    if (activeBranchId) {
      const targetStats = await dashboardRepository.getBranchTargetStats(tenantId, activeBranchId);
      const perf = targetStats.assigned_target
        ? Math.round((targetStats.achieved_target / targetStats.assigned_target) * 100)
        : 0;
      summary.branchPerformance = perf;
      
      const teamPerf = await dashboardRepository.getBranchTLPerformance(tenantId, activeBranchId);
      summary.teamPerformance = teamPerf;
    } else {
      summary.branchPerformance = 0;
      summary.teamPerformance = 0;
    }
  }
  
  return summary;
};

const getLeadFunnel = async (tenantId, userId, role, filters) => {
  const rows = await dashboardRepository.getLeadFunnel(tenantId, filters);
  return rows;
};

const getRevenueTrend = async (tenantId, userId, role, months, filters) => {
  const rows = await dashboardRepository.getRevenueTrend(tenantId, months, filters);
  return rows;
};

const getBranchPerformance = async (tenantId, userId, role, filters) => {
  const rows = await dashboardRepository.getBranchPerformance(tenantId, filters);
  return rows;
};

const getTeamPerformance = async (tenantId, userId, role, filters) => {
  const rows = await dashboardRepository.getTeamPerformance(tenantId, filters);
  return rows;
};

const getRecentActivities = async (tenantId, userId, role, limit, filters) => {
  const rows = await dashboardRepository.getRecentActivities(tenantId, limit, filters);
  return rows;
};

const getUpcomingFollowups = async (tenantId, userId, role, limit, filters) => {
  const rows = await dashboardRepository.getUpcomingFollowups(tenantId, limit, filters);
  return rows;
};

const getQuarterlyPerformance = async (tenantId, filters) => {
  const rows = await dashboardRepository.getQuarterlyPerformance(tenantId, filters);
  return rows;
};

module.exports = {
  getSummary,
  getLeadFunnel,
  getRevenueTrend,
  getBranchPerformance,
  getTeamPerformance,
  getRecentActivities,
  getUpcomingFollowups,
  getQuarterlyPerformance
};
