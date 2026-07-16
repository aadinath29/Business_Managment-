const paymentService = require('../services/paymentService');
const { createPaymentSchema } = require('../validators/paymentValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Payment Validation Error payload:', JSON.stringify(data, null, 2));
    console.error('Payment Validation Error details:', JSON.stringify(result.error.format(), null, 2));
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

const recordPayment = async (req, res, next) => {
  try {
    const validatedData = validate(createPaymentSchema, req.body);
    const tenantId = req.user.tenant_id;
    const invoiceId = req.params.id; // comes from /invoices/:id/payments
    
    const payment = await paymentService.recordPayment(tenantId, invoiceId, validatedData);
    
    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

const listPaymentsForInvoice = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const invoiceId = req.params.id;
    
    const payments = await paymentService.getPaymentsByInvoiceId(tenantId, invoiceId);
    
    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const paymentId = req.params.id;
    
    await paymentService.deletePayment(tenantId, paymentId);
    
    return res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const { updatePaymentSchema } = require('../validators/paymentValidator');
    const validatedData = validate(updatePaymentSchema, req.body);
    const tenantId = req.user.tenant_id;
    const paymentId = req.params.id;
    
    const payment = await paymentService.updatePayment(tenantId, paymentId, validatedData);
    
    return res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPayment,
  listPaymentsForInvoice,
  updatePayment,
  deletePayment
};
