const proformaRepository = require('../repositories/proformaRepository');
const db = require('../../database');
const { ValidationError } = require('../../auth/errors/authErrors');

const createProforma = async (tenantId, data) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    // Ensure due_date is >= proforma_date if provided
    if (data.due_date && new Date(data.due_date) < new Date(data.proforma_date)) {
      throw new ValidationError('Due date cannot be before proforma date');
    }
    
    const proformaData = {
      lead_id: data.lead_id,
      quotation_id: data.quotation_id || null,
      proforma_number: data.proforma_number,
      proforma_date: data.proforma_date,
      due_date: data.due_date || null,
      status: data.status,
      notes: data.notes
    };
    
    const newProforma = await proformaRepository.createProforma(tenantId, proformaData, data.items, client);
    
    await client.query('COMMIT');
    return newProforma;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const listProformas = async (tenantId, queryParams) => {
  const { page, limit, lead_id, status } = queryParams;
  return await proformaRepository.listProformas(tenantId, { lead_id, status }, page, limit);
};

const getProformaById = async (tenantId, proformaId) => {
  const proforma = await proformaRepository.getProformaById(tenantId, proformaId);
  if (!proforma) {
    throw new ValidationError('Proforma not found');
  }
  return proforma;
};

const updateProformaStatus = async (tenantId, proformaId, status) => {
  const proforma = await proformaRepository.getProformaById(tenantId, proformaId);
  if (!proforma) {
    throw new ValidationError('Proforma not found');
  }

  const updatedProforma = await proformaRepository.updateProformaStatus(tenantId, proformaId, status);
  return updatedProforma;
};

module.exports = {
  createProforma,
  listProformas,
  getProformaById,
  updateProformaStatus
};
