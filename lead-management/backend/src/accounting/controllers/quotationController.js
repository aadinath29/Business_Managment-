const quotationService = require('../services/quotationService');
const { createQuotationSchema, updateQuotationSchema, listQuotationsQuerySchema } = require('../validators/quotationValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Validation failed details:', JSON.stringify(result.error.format(), null, 2));
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

const createQuotation = async (req, res, next) => {
  try {
    const validatedData = validate(createQuotationSchema, req.body);
    const tenantId = req.user.tenant_id;
    
    const quotation = await quotationService.createQuotation(tenantId, validatedData);
    
    return res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

const listQuotations = async (req, res, next) => {
  try {
    const validatedQuery = validate(listQuotationsQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    
    const result = await quotationService.listQuotations(tenantId, validatedQuery);
    
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

const getQuotationById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const quotationId = req.params.id;
    
    const quotation = await quotationService.getQuotationById(tenantId, quotationId);
    
    return res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

const updateQuotation = async (req, res, next) => {
  try {
    const validatedData = validate(updateQuotationSchema, req.body);
    const tenantId = req.user.tenant_id;
    const quotationId = req.params.id;
    
    const quotation = await quotationService.updateQuotation(tenantId, quotationId, validatedData);
    
    return res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

const reviseQuotation = async (req, res, next) => {
  try {
    // Only validating fields that need to change for revision
    const validatedData = validate(updateQuotationSchema, req.body);
    const tenantId = req.user.tenant_id;
    const quotationId = req.params.id;
    
    // Pass original quotation number if provided, else it defaults in service
    if (req.body.quotation_number) {
        validatedData.quotation_number = req.body.quotation_number;
    }
    if (req.body.quotation_date) {
        validatedData.quotation_date = req.body.quotation_date;
    } else {
        validatedData.quotation_date = new Date().toISOString().split('T')[0];
    }
    
    const quotation = await quotationService.reviseQuotation(tenantId, quotationId, validatedData);
    
    return res.status(201).json({
      success: true,
      message: 'Quotation revised successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuotation,
  listQuotations,
  getQuotationById,
  updateQuotation,
  reviseQuotation
};
