const developerService = require('../services/developerService');
const {
  uuidParamSchema,
  createDeveloperSchema,
  updateDeveloperSchema
} = require('../validators/developerValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("Zod Validation Error:", result.error.format());
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

/**
 * Provision new developer user & profile
 */
const createDeveloper = async (req, res, next) => {
  try {
    const validatedData = validate(createDeveloperSchema, req.body);
    const developer = await developerService.createDeveloper(
      req.user.tenant_id,
      req.user.role,
      req.user.user_id,
      validatedData
    );
    res.status(201).json({
      success: true,
      data: developer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get list of developers under tenant
 */
const getDevelopers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const teamId = req.query.team_id || '';
    const status = req.query.status || '';

    const { rows, total } = await developerService.getDevelopers(
      req.user.tenant_id,
      req.user.role,
      req.user.user_id,
      { page, limit, search, team_id: teamId, status }
    );

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get developer by profile ID
 */
const getDeveloperById = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const developer = await developerService.getDeveloperById(
      id,
      req.user.tenant_id,
      req.user.role,
      req.user.user_id
    );
    res.status(200).json({
      success: true,
      data: developer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get developer detailed profile view
 */
const getDeveloperProfile = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const profile = await developerService.getDeveloperProfile(
      id,
      req.user.tenant_id,
      req.user.role,
      req.user.user_id
    );
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get developer performance metrics
 */
const getDeveloperPerformance = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const performance = await developerService.getDeveloperPerformance(
      id,
      req.user.tenant_id,
      req.user.role,
      req.user.user_id
    );
    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update developer details
 */
const updateDeveloper = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    const validatedData = validate(updateDeveloperSchema, req.body);
    const updated = await developerService.updateDeveloper(
      id,
      req.user.tenant_id,
      req.user.role,
      validatedData
    );
    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Soft delete developer profile and user account
 */
const deleteDeveloper = async (req, res, next) => {
  try {
    const { id } = validate(uuidParamSchema, req.params);
    await developerService.deleteDeveloper(id, req.user.tenant_id, req.user.role);
    res.status(200).json({
      success: true,
      message: 'Developer deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDeveloper,
  getDevelopers,
  getDeveloperById,
  getDeveloperProfile,
  getDeveloperPerformance,
  updateDeveloper,
  deleteDeveloper
};
