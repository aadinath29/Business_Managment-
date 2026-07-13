const projectService = require('../services/projectService');
const {
  assignLeadSchema,
  reassignLeadSchema,
  createProjectSchema,
  updateProjectSchema,
  updateProgressSchema,
  listProjectsQuerySchema
} = require('../validators/projectValidator');
const { leadIdParamSchema } = require('../validators/leadValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

// === Lead Assignment Controllers ===

const assignLead = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(assignLeadSchema, req.body);
    const tenantId = req.user.tenant_id;
    const assignerId = req.user.user_id;
    const assignerRole = req.user.role;

    const assignment = await projectService.assignOrReassignLead(
      leadId, tenantId, assignerId, assignerRole, validatedData, false
    );

    return res.status(201).json({
      success: true,
      message: 'Lead assigned successfully',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

const reassignLead = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(reassignLeadSchema, req.body);
    const tenantId = req.user.tenant_id;
    const assignerId = req.user.user_id;
    const assignerRole = req.user.role;

    const assignment = await projectService.assignOrReassignLead(
      leadId, tenantId, assignerId, assignerRole, validatedData, true
    );

    return res.status(200).json({
      success: true,
      message: 'Lead reassigned successfully',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

const getLeadAssignment = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const assignment = await projectService.getLeadAssignment(leadId, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

const getLeadAssignmentHistory = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const history = await projectService.getLeadAssignmentHistory(leadId, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// === Projects Controllers ===

const createProject = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(createProjectSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const project = await projectService.createProject(leadId, tenantId, userId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const filters = validate(listProjectsQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const result = await projectService.getProjects(tenantId, userRole, userId, filters);
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

const getProjectById = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const project = await projectService.getProjectById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateProjectSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const project = await projectService.updateProject(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    await projectService.deleteProject(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateProjectProgress = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateProgressSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const project = await projectService.updateProjectProgress(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Project progress updated successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

const getProjectStatistics = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const statistics = await projectService.getProjectStatistics(tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignLead,
  reassignLead,
  getLeadAssignment,
  getLeadAssignmentHistory,
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectProgress,
  getProjectStatistics
};
