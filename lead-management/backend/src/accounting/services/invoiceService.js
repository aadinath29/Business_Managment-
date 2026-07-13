const invoiceRepository = require('../repositories/invoiceRepository');
const db = require('../../database');
const { ValidationError } = require('../../auth/errors/authErrors');

const createInvoice = async (tenantId, data) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    // Ensure due_date is >= invoice_date if provided
    if (data.due_date && new Date(data.due_date) < new Date(data.invoice_date)) {
      throw new ValidationError('Due date cannot be before invoice date');
    }
    
    const invoiceData = {
      lead_id: data.lead_id,
      proforma_id: data.proforma_id || null,
      invoice_number: data.invoice_number,
      invoice_date: data.invoice_date,
      due_date: data.due_date || null,
      invoice_type: data.invoice_type,
      place_of_supply: data.place_of_supply || null,
      currency: data.currency,
      status: data.status
    };
    
    const newInvoice = await invoiceRepository.createInvoice(tenantId, invoiceData, data.items, client);
    
    await client.query('COMMIT');
    return newInvoice;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listInvoices = async (tenantId, queryParams) => {
  const { page, limit, lead_id, status, invoice_type } = queryParams;
  return await invoiceRepository.listInvoices(tenantId, { lead_id, status, invoice_type }, page, limit);
};

const getInvoiceById = async (tenantId, invoiceId) => {
  const invoice = await invoiceRepository.getInvoiceById(tenantId, invoiceId);
  if (!invoice) {
    throw new ValidationError('Invoice not found');
  }
  return invoice;
};

module.exports = {
  createInvoice,
  listInvoices,
  getInvoiceById
};
