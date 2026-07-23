const db = require('../../database');

const createProforma = async (tenantId, proformaData, items, client) => {
  const executor = client || db;
  const {
    lead_id,
    quotation_id,
    proforma_number,
    proforma_date,
    due_date,
    status,
    notes
  } = proformaData;

  const result = await executor.query(
    `INSERT INTO accounting_proformas 
      (tenant_id, lead_id, quotation_id, proforma_number, proforma_date, due_date, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [tenantId, lead_id, quotation_id, proforma_number, proforma_date, due_date, status, notes]
  );
  
  const proforma = result.rows[0];

  for (const item of items) {
    await executor.query(
      `INSERT INTO proforma_items 
        (proforma_id, service_name, description, hsn_sac, quantity, unit, rate, discount_percentage, tax_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [proforma.id, item.service_name, item.description, item.hsn_sac, item.quantity, item.unit, item.rate, item.discount_percentage, item.tax_percentage]
    );
  }

  const updatedProforma = await executor.query(
    'SELECT * FROM accounting_proformas WHERE id = $1',
    [proforma.id]
  );

  return updatedProforma.rows[0];
};

const getProformaById = async (tenantId, proformaId) => {
  const result = await db.query(
    `SELECT * FROM accounting_proformas WHERE tenant_id = $1 AND id = $2`,
    [tenantId, proformaId]
  );
  if (result.rows.length === 0) return null;

  const itemsResult = await db.query(
    `SELECT * FROM proforma_items WHERE proforma_id = $1 ORDER BY created_at ASC`,
    [proformaId]
  );

  const proforma = result.rows[0];
  proforma.items = itemsResult.rows;
  return proforma;
};

const listProformas = async (tenantId, filters, page, limit) => {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM accounting_proformas WHERE tenant_id = $1';
  const params = [tenantId];
  let paramCount = 1;

  if (filters.lead_id) {
    paramCount++;
    query += ` AND lead_id = $${paramCount}`;
    params.push(filters.lead_id);
  }
  if (filters.status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    params.push(filters.status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  
  let countQuery = 'SELECT COUNT(*) FROM accounting_proformas WHERE tenant_id = $1';
  const countParams = [tenantId];
  let countParamCount = 1;
  
  if (filters.lead_id) {
    countParamCount++;
    countQuery += ` AND lead_id = $${countParamCount}`;
    countParams.push(filters.lead_id);
  }
  if (filters.status) {
    countParamCount++;
    countQuery += ` AND status = $${countParamCount}`;
    countParams.push(filters.status);
  }
  
  const countResult = await db.query(countQuery, countParams);

  return {
    data: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit
  };
};

const updateProformaStatus = async (tenantId, proformaId, status) => {
  const query = `
    UPDATE accounting_proformas 
    SET status = $3 
    WHERE tenant_id = $1 AND id = $2 
    RETURNING *`;
    
  const result = await db.query(query, [tenantId, proformaId, status]);
  return result.rows[0];
};

const updateProforma = async (tenantId, proformaId, updateData) => {
  const updates = [];
  const params = [tenantId, proformaId];
  let paramCount = 2;

  const fields = ['proforma_number', 'proforma_date', 'due_date', 'status', 'notes', 'document_url'];
  
  fields.forEach(field => {
    if (updateData[field] !== undefined) {
      paramCount++;
      updates.push(`${field} = $${paramCount}`);
      params.push(updateData[field]);
    }
  });

  if (updates.length === 0) return await getProformaById(tenantId, proformaId);

  const query = `
    UPDATE accounting_proformas 
    SET ${updates.join(', ')} 
    WHERE tenant_id = $1 AND id = $2 
    RETURNING *`;
    
  const result = await db.query(query, params);
  return result.rows[0];
};

const replaceProformaItems = async (proformaId, items, client) => {
  const executor = client || db;
  await executor.query(`DELETE FROM proforma_items WHERE proforma_id = $1`, [proformaId]);
  
  for (const item of items) {
    await executor.query(
      `INSERT INTO proforma_items 
        (proforma_id, service_name, description, hsn_sac, quantity, unit, rate, discount_percentage, tax_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [proformaId, item.service_name, item.description, item.hsn_sac, item.quantity, item.unit, item.rate, item.discount_percentage, item.tax_percentage]
    );
  }
};

const deleteProforma = async (tenantId, proformaId) => {
  const result = await db.query(
    `DELETE FROM accounting_proformas WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, proformaId]
  );
  return result.rows[0];
};

module.exports = {
  createProforma,
  getProformaById,
  listProformas,
  updateProformaStatus,
  updateProforma,
  replaceProformaItems,
  deleteProforma
};
