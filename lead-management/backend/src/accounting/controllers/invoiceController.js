const invoiceService = require('../services/invoiceService');
const { createInvoiceSchema, listInvoicesQuerySchema, updateInvoiceSchema } = require('../validators/invoiceValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Validation Error payload:', JSON.stringify(data, null, 2));
    console.error('Validation Error details:', JSON.stringify(result.error.format(), null, 2));
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

const createInvoice = async (req, res, next) => {
  try {
    const validatedData = validate(createInvoiceSchema, req.body);
    const tenantId = req.user.tenant_id;
    
    const invoice = await invoiceService.createInvoice(tenantId, validatedData);
    
    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

const listInvoices = async (req, res, next) => {
  try {
    const validatedQuery = validate(listInvoicesQuerySchema, req.query);
    const tenantId = req.user.tenant_id;
    
    const result = await invoiceService.listInvoices(tenantId, validatedQuery);
    
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

const getInvoiceById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const invoiceId = req.params.id;
    
    const invoice = await invoiceService.getInvoiceById(tenantId, invoiceId);
    
    return res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const validatedData = validate(updateInvoiceSchema, req.body);
    const tenantId = req.user.tenant_id;
    const invoiceId = req.params.id;
    
    const invoice = await invoiceService.updateInvoice(tenantId, invoiceId, validatedData);
    
    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const invoiceId = req.params.id;
    
    await invoiceService.deleteInvoice(tenantId, invoiceId);
    
    return res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  listInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice
};
