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
      notes: data.notes
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

    if (updateData.status || updateData.validity_days !== undefined || updateData.notes !== undefined) {
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
      notes: data.notes !== undefined ? data.notes : oldQuotation.notes
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

module.exports = {
  createQuotation,
  listQuotations,
  getQuotationById,
  updateQuotation,
  reviseQuotation
};
