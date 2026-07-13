const deliveryCSService = require('../services/deliveryCSService');
const {
  createDeliverySchema,
  updateDeliverySchema,
  createCSSchema,
  updateCSSchema,
  listDeliveryQuerySchema,
  listCSQuerySchema
} = require('../validators/deliveryCSValidator');
const { leadIdParamSchema } = require('../validators/leadValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

// === Delivery Controllers ===

const createDelivery = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(createDeliverySchema, req.body);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const delivery = await deliveryCSService.createDelivery(leadId, tenantId, userId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Delivery record created successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

const getDeliveryByLeadId = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const delivery = await deliveryCSService.getDeliveryByLeadId(leadId, tenantId, userId, userRole);

    return res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

const updateDelivery = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateDeliverySchema, req.body);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const delivery = await deliveryCSService.updateDelivery(id, tenantId, userId, userRole, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Delivery record updated successfully',
      data: delivery
    });
  } catch (error) {
    next(error);
  }
};

const deleteDelivery = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    await deliveryCSService.deleteDelivery(id, tenantId, userId, userRole);

    return res.status(200).json({
      success: true,
      message: 'Delivery record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const listDeliveries = async (req, res, next) => {
  try {
    const filters = validate(listDeliveryQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const result = await deliveryCSService.listDeliveries(tenantId, userId, userRole, filters);
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

// === Customer Success Controllers ===

const createCustomerSuccess = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(createCSSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const cs = await deliveryCSService.createCustomerSuccess(leadId, tenantId, userId, userRole, validatedData);

    return res.status(201).json({
      success: true,
      message: 'Customer Success record created successfully',
      data: cs
    });
  } catch (error) {
    next(error);
  }
};

const getCSByLeadId = async (req, res, next) => {
  try {
    const { id: leadId } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const cs = await deliveryCSService.getCSByLeadId(leadId, tenantId, userId, userRole);

    return res.status(200).json({
      success: true,
      data: cs
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomerSuccess = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const validatedData = validate(updateCSSchema, req.body);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const cs = await deliveryCSService.updateCustomerSuccess(id, tenantId, userId, userRole, validatedData);

    return res.status(200).json({
      success: true,
      message: 'Customer Success record updated successfully',
      data: cs
    });
  } catch (error) {
    next(error);
  }
};

const deleteCustomerSuccess = async (req, res, next) => {
  try {
    const { id } = validate(leadIdParamSchema, req.params);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    await deliveryCSService.deleteCustomerSuccess(id, tenantId, userId, userRole);

    return res.status(200).json({
      success: true,
      message: 'Customer Success record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const listCS = async (req, res, next) => {
  try {
    const filters = validate(listCSQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    const result = await deliveryCSService.listCS(tenantId, userId, userRole, filters);
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

module.exports = {
  createDelivery,
  getDeliveryByLeadId,
  updateDelivery,
  deleteDelivery,
  listDeliveries,
  
  createCustomerSuccess,
  getCSByLeadId,
  updateCustomerSuccess,
  deleteCustomerSuccess,
  listCS
};
