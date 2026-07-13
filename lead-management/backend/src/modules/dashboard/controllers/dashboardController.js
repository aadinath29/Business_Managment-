const { dashboardFilterSchema } = require('../validators/dashboardValidator');
const dashboardService = require('../services/dashboardService');
const { ValidationError } = require('../../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

const enforceFilterScope = (role, filters) => {
  if (role !== 'SUPER_ADMIN') {
    delete filters.branchId;
  }
  if (role === 'TEAM_LEADER' || role === 'DEVELOPER') {
    delete filters.teamId;
  }
};

const getSummary = async (req, res, next) => {
  try {
    const filters = validate(dashboardFilterSchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const role = req.user.role;
    enforceFilterScope(role, filters);

    const data = await dashboardService.getSummary(tenantId, userId, role, filters);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getLeadFunnel = async (req, res, next) => {
  try {
    const filters = validate(dashboardFilterSchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const role = req.user.role;
    enforceFilterScope(role, filters);

    const data = await dashboardService.getLeadFunnel(tenantId, userId, role, filters);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getRevenueTrend = async (req, res, next) => {
  try {
    const filters = validate(dashboardFilterSchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const role = req.user.role;
    enforceFilterScope(role, filters);
    const months = filters.months || 6;

    const data = await dashboardService.getRevenueTrend(tenantId, userId, role, months, filters);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getBranchPerformance = async (req, res, next) => {
  try {
    const filters = validate(dashboardFilterSchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const role = req.user.role;
    enforceFilterScope(role, filters);

    const data = await dashboardService.getBranchPerformance(tenantId, userId, role, filters);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getTeamPerformance = async (req, res, next) => {
  try {
    const filters = validate(dashboardFilterSchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const role = req.user.role;
    enforceFilterScope(role, filters);

    const data = await dashboardService.getTeamPerformance(tenantId, userId, role, filters);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getRecentActivities = async (req, res, next) => {
  try {
    const filters = validate(dashboardFilterSchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const role = req.user.role;
    enforceFilterScope(role, filters);
    const limit = filters.limit || 10;

    const data = await dashboardService.getRecentActivities(tenantId, userId, role, limit, filters);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getUpcomingFollowups = async (req, res, next) => {
  try {
    const filters = validate(dashboardFilterSchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const role = req.user.role;
    enforceFilterScope(role, filters);
    const limit = filters.limit || 10;

    const data = await dashboardService.getUpcomingFollowups(tenantId, userId, role, limit, filters);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getQuarterlyPerformance = async (req, res, next) => {
  try {
    // Note: fyOffset might not be in dashboardFilterSchema. We can safely parse it here.
    const filters = validate(dashboardFilterSchema, req.query);
    filters.fyOffset = parseInt(req.query.fyOffset) || 0;
    
    const tenantId = req.user.tenant_id;
    const role = req.user.role;
    enforceFilterScope(role, filters);

    const data = await dashboardService.getQuarterlyPerformance(tenantId, filters);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
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
