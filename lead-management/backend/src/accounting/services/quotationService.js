const quotationRepository = require('../repositories/quotationRepository');
const db = require('../../database');
const { ValidationError } = require('../../auth/errors/authErrors');

const createQuotation = async (tenantId, data) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    const quotationData = {
      lead_id: data.lead_id,
      parent_quotation_id: null,
      is_latest_revision: true,
      quotation_number: data.quotation_number,
      quotation_date: data.quotation_date,
      validity_days: data.validity_days,
      status: data.status,
      notes: data.notes,
      customer_name: data.customer_name,
      bill_to: data.bill_to,
      ship_to: data.ship_to,
      payment_terms: data.payment_terms,
      priority: data.priority,
      shipping_amount: data.shipping_amount,
      terms: data.terms
    };
    
    const newQuotation = await quotationRepository.createQuotation(tenantId, quotationData, data.items, client);
    
    await client.query('COMMIT');
    return newQuotation;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listQuotations = async (tenantId, queryParams) => {
  const { page, limit, lead_id, status } = queryParams;
  return await quotationRepository.listQuotations(tenantId, { lead_id, status }, page, limit);
};

const getQuotationById = async (tenantId, quotationId) => {
  const quotation = await quotationRepository.getQuotationById(tenantId, quotationId);
  if (!quotation) {
    throw new ValidationError('Quotation not found');
  }
  return quotation;
};

const updateQuotation = async (tenantId, quotationId, updateData) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    const quotation = await quotationRepository.getQuotationById(tenantId, quotationId);
    if (!quotation) {
      throw new ValidationError('Quotation not found');
    }

    const updateFields = ['status', 'validity_days', 'notes', 'customer_name', 'bill_to', 'ship_to', 'payment_terms', 'priority', 'shipping_amount', 'terms'];
    const hasUpdates = updateFields.some(field => updateData[field] !== undefined);
    
    if (hasUpdates) {
      await quotationRepository.updateQuotationStatus(tenantId, quotationId, updateData);
    }
    
    if (updateData.items && updateData.items.length > 0) {
      await quotationRepository.replaceQuotationItems(quotationId, updateData.items, client);
    }
    
    await client.query('COMMIT');
    return await getQuotationById(tenantId, quotationId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const reviseQuotation = async (tenantId, quotationId, data) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    const oldQuotation = await quotationRepository.getQuotationById(tenantId, quotationId);
    if (!oldQuotation) {
      throw new ValidationError('Original Quotation not found');
    }
    
    // Determine the root parent ID. If oldQuotation is already a revision, it has a parent.
    const parent_quotation_id = oldQuotation.parent_quotation_id || oldQuotation.id;
    
    const quotationData = {
      lead_id: oldQuotation.lead_id,
      parent_quotation_id: parent_quotation_id,
      is_latest_revision: true, // The trigger will automatically mark older ones as false
      quotation_number: data.quotation_number || oldQuotation.quotation_number + '-REV',
      quotation_date: data.quotation_date,
      validity_days: data.validity_days !== undefined ? data.validity_days : oldQuotation.validity_days,
      status: 'Draft',
      notes: data.notes !== undefined ? data.notes : oldQuotation.notes,
      customer_name: data.customer_name !== undefined ? data.customer_name : oldQuotation.customer_name,
      bill_to: data.bill_to !== undefined ? data.bill_to : oldQuotation.bill_to,
      ship_to: data.ship_to !== undefined ? data.ship_to : oldQuotation.ship_to,
      payment_terms: data.payment_terms !== undefined ? data.payment_terms : oldQuotation.payment_terms,
      priority: data.priority !== undefined ? data.priority : oldQuotation.priority,
      shipping_amount: data.shipping_amount !== undefined ? data.shipping_amount : oldQuotation.shipping_amount,
      terms: data.terms !== undefined ? data.terms : oldQuotation.terms
    };
    
    const items = data.items && data.items.length > 0 ? data.items : oldQuotation.items;
    
    const newQuotation = await quotationRepository.createQuotation(tenantId, quotationData, items, client);
    
    await client.query('COMMIT');
    return newQuotation;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteQuotation = async (tenantId, quotationId) => {
  const deletedQuotation = await quotationRepository.deleteQuotation(tenantId, quotationId);
  if (!deletedQuotation) {
    throw new ValidationError('Quotation not found');
  }
  return deletedQuotation;
};

module.exports = {
  createQuotation,
  listQuotations,
  getQuotationById,
  updateQuotation,
  reviseQuotation,
  deleteQuotation
};
