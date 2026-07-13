const proformaService = require('../services/proformaService');
const { createProformaSchema, updateProformaStatusSchema, listProformasQuerySchema } = require('../validators/proformaValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Validation failed details:', JSON.stringify(result.error.format(), null, 2));
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

const createProforma = async (req, res, next) => {
  try {
    const validatedData = validate(createProformaSchema, req.body);
    const tenantId = req.user.tenant_id;
    
    const proforma = await proformaService.createProforma(tenantId, validatedData);
    
    return res.status(201).json({
      success: true,
      message: 'Proforma created successfully',
      data: proforma
    });
  } catch (error) {
    next(error);
  }
};

const listProformas = async (req, res, next) => {
  try {
    const validatedQuery = validate(listProformasQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    
    const result = await proformaService.listProformas(tenantId, validatedQuery);
    
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProformaById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const proformaId = req.params.id;
    
    const proforma = await proformaService.getProformaById(tenantId, proformaId);
    
    return res.status(200).json({
      success: true,
      data: proforma
    });
  } catch (error) {
    next(error);
  }
};

const updateProformaStatus = async (req, res, next) => {
  try {
    const validatedData = validate(updateProformaStatusSchema, req.body);
    const tenantId = req.user.tenant_id;
    const proformaId = req.params.id;
    
    const proforma = await proformaService.updateProformaStatus(tenantId, proformaId, validatedData.status);
    
    return res.status(200).json({
      success: true,
      message: 'Proforma status updated successfully',
      data: proforma
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProforma,
  listProformas,
  getProformaById,
  updateProformaStatus
};
