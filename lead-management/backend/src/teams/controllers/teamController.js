const { z } = require('zod');
const teamService = require('../services/teamService');
const {
  uuidParamSchema,
  teamLeaderParamSchema,
  createTeamSchema,
  updateTeamSchema,
  createLeaderSchema,
  updateLeaderSchema,
  assignDevelopersSchema
} = require('../validators/teamValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

// Query validation schemas
const listTeamsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  search: z.string().trim().optional(),
  branch_id: z.string().uuid().optional(),
  department: z.string().trim().optional(),
  has_leader: z.enum(['true', 'false']).optional()
});

const listLeadersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  search: z.string().trim().optional(),
  branch_id: z.string().uuid().optional(),
  status: z.string().trim().optional()
});

const createTeam = async (req, res, next) => {
  try {
    const validatedData = validate(createTeamSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    const team = await teamService.createTeamWithLeader(tenantId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
};

const getTeams = async (req, res, next) => {
  try {
    const filters = validate(listTeamsQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const result = await teamService.getTeams(tenantId, userRole, userId, filters);
    const totalPages = Math.ceil(result.total / filters.limit) || 1;

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTeamById = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const team = await teamService.getTeamById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const validatedData = validate(updateTeamSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    const team = await teamService.updateTeam(id, tenantId, userRole, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    await teamService.deleteTeam(id, tenantId, userRole);

    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const createTeamLeader = async (req, res, next) => {
  try {
    const validatedData = validate(createLeaderSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    const leader = await teamService.createTeamLeaderOnly(tenantId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Team Leader created successfully',
      data: leader
    });
  } catch (error) {
    next(error);
  }
};

const getTeamLeaders = async (req, res, next) => {
  try {
    const filters = validate(listLeadersQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const result = await teamService.getTeamLeaders(tenantId, userRole, userId, filters);
    const totalPages = Math.ceil(result.total / filters.limit) || 1;

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTeamLeaderById = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const leader = await teamService.getTeamLeaderById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: leader
    });
  } catch (error) {
    next(error);
  }
};

const updateTeamLeader = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const validatedData = validate(updateLeaderSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    const leader = await teamService.updateTeamLeader(id, tenantId, userRole, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Team Leader profile updated successfully',
      data: leader
    });
  } catch (error) {
    next(error);
  }
};

const deleteTeamLeader = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    await teamService.deleteTeamLeader(id, tenantId, userRole);

    return res.status(200).json({
      success: true,
      message: 'Team Leader deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const assignDevelopers = async (req, res, next) => {
  try {
    const { teamLeaderId } = validate(teamLeaderParamSchema, req.params);
    const { developer_ids } = validate(assignDevelopersSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    const developers = await teamService.assignDevelopers(teamLeaderId, developer_ids, tenantId, userRole);

    return res.status(200).json({
      success: true,
      message: 'Developers assigned successfully',
      data: developers
    });
  } catch (error) {
    next(error);
  }
};

const getDevelopers = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const developers = await teamService.getDevelopersForLeader(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: developers
    });
  } catch (error) {
    next(error);
  }
};

const getTeamPerformance = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const performance = await teamService.getTeamPerformance(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
};

const getTeamDashboardStats = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const stats = await teamService.getTeamDashboardStats(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

const getTeamStats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    const stats = await teamService.getTeamStats(tenantId, userRole);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  createTeamLeader,
  getTeamLeaders,
  getTeamLeaderById,
  updateTeamLeader,
  deleteTeamLeader,
  assignDevelopers,
  getDevelopers,
  getTeamPerformance,
  getTeamStats,
  getTeamDashboardStats
};
