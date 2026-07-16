const paymentRepository = require('../repositories/paymentRepository');
const invoiceRepository = require('../repositories/invoiceRepository');
const db = require('../../database');
const { ValidationError } = require('../../auth/errors/authErrors');

const recordPayment = async (tenantId, invoiceId, data) => {
  // Check if invoice exists and belongs to tenant
  const invoice = await invoiceRepository.getInvoiceById(tenantId, invoiceId);
  if (!invoice) {
    throw new ValidationError('Invoice not found');
  }

  // Record the payment
  const newPayment = await paymentRepository.recordPayment(tenantId, invoiceId, data);
  
  // Note: the database trigger `trg_sync_invoice_ledger` automatically updates 
  // the invoice's amount_paid and balance_due.
  
  return newPayment;
};

const getPaymentsByInvoiceId = async (tenantId, invoiceId) => {
  // Ensure the invoice exists and belongs to tenant
  const invoice = await invoiceRepository.getInvoiceById(tenantId, invoiceId);
  if (!invoice) {
    throw new ValidationError('Invoice not found');
  }

  return await paymentRepository.getPaymentsByInvoiceId(tenantId, invoiceId);
};

const deletePayment = async (tenantId, paymentId) => {
  const deletedPayment = await paymentRepository.deletePayment(tenantId, paymentId);
  if (!deletedPayment) {
    throw new ValidationError('Payment not found');
  }
  return deletedPayment;
};

const updatePayment = async (tenantId, paymentId, data) => {
  const updatedPayment = await paymentRepository.updatePayment(tenantId, paymentId, data);
  if (!updatedPayment) {
    throw new ValidationError('Payment not found or no changes made');
  }
  return updatedPayment;
};

module.exports = {
  recordPayment,
  getPaymentsByInvoiceId,
  updatePayment,
  deletePayment
};
