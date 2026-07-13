const branchService = require('../services/branchService');
const {
  createBranchSchema,
  updateBranchSchema,
  listBranchesQuerySchema,
  branchIdParamSchema
} = require('../validators/branchValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

const createBranch = async (req, res, next) => {
  try {
    const validatedData = validate(createBranchSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;

    const branch = await branchService.createBranch(tenantId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

const getBranches = async (req, res, next) => {
  try {
    const filters = validate(listBranchesQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const result = await branchService.getBranches(tenantId, userRole, userId, filters);
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

const getBranchById = async (req, res, next) => {
  try {
    const { id } = validate(branchIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const branch = await branchService.getBranchById(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const { id } = validate(branchIdParamSchema, req.params);
    const validatedData = validate(updateBranchSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    const branch = await branchService.updateBranch(id, tenantId, userRole, userId, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

const deleteBranch = async (req, res, next) => {
  try {
    const { id } = validate(branchIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userRole = req.user.role;
    const userId = req.user.user_id;

    await branchService.deleteBranch(id, tenantId, userRole, userId);

    return res.status(200).json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch
};
