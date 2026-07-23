const db = require('../../database');

const createQuotation = async (tenantId, quotationData, items, client) => {
  const executor = client || db;
  const {
    lead_id,
    parent_quotation_id,
    is_latest_revision,
    quotation_number,
    quotation_date,
    validity_days,
    status,
    notes,
    customer_name,
    bill_to,
    ship_to,
    payment_terms,
    priority,
    shipping_amount,
    terms
  } = quotationData;

  const result = await executor.query(
    `INSERT INTO accounting_quotations 
      (tenant_id, lead_id, parent_quotation_id, is_latest_revision, quotation_number, quotation_date, validity_days, status, notes, customer_name, bill_to, ship_to, payment_terms, priority, shipping_amount, terms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [tenantId, lead_id, parent_quotation_id, is_latest_revision, quotation_number, quotation_date, validity_days, status, notes, customer_name, bill_to, ship_to, payment_terms, priority, shipping_amount, terms]
  );
  
  const quotation = result.rows[0];

  for (const item of items) {
    await executor.query(
      `INSERT INTO quotation_items 
        (quotation_id, service_name, description, hsn_sac, quantity, unit, rate, discount_percentage, tax_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [quotation.id, item.service_name, item.description, item.hsn_sac, item.quantity, item.unit, item.rate, item.discount_percentage, item.tax_percentage]
    );
  }

  // The DB trigger will automatically recalculate the totals, so we fetch the updated quotation
  const updatedQuotation = await executor.query(
    'SELECT * FROM accounting_quotations WHERE id = $1',
    [quotation.id]
  );

  return updatedQuotation.rows[0];
};

const getQuotationById = async (tenantId, quotationId) => {
  const result = await db.query(
    `SELECT * FROM accounting_quotations WHERE tenant_id = $1 AND id = $2`,
    [tenantId, quotationId]
  );
  if (result.rows.length === 0) return null;

  const itemsResult = await db.query(
    `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY created_at ASC`,
    [quotationId]
  );

  const quotation = result.rows[0];
  quotation.items = itemsResult.rows;
  return quotation;
};

const listQuotations = async (tenantId, filters, page, limit) => {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM accounting_quotations WHERE tenant_id = $1';
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
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM accounting_quotations WHERE tenant_id = $1';
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

const updateQuotationStatus = async (tenantId, quotationId, updateData) => {
  const updates = [];
  const params = [tenantId, quotationId];
  let paramCount = 2;

  const fields = ['status', 'validity_days', 'notes', 'customer_name', 'bill_to', 'ship_to', 'payment_terms', 'priority', 'shipping_amount', 'terms', 'document_url'];
  
  fields.forEach(field => {
    if (updateData[field] !== undefined) {
      paramCount++;
      updates.push(`${field} = $${paramCount}`);
      params.push(updateData[field]);
    }
  });

  if (updates.length === 0) return await getQuotationById(tenantId, quotationId);

  const query = `
    UPDATE accounting_quotations 
    SET ${updates.join(', ')} 
    WHERE tenant_id = $1 AND id = $2 
    RETURNING *`;
    
  const result = await db.query(query, params);
  return result.rows[0];
};

const replaceQuotationItems = async (quotationId, items, client) => {
  const executor = client || db;
  await executor.query(`DELETE FROM quotation_items WHERE quotation_id = $1`, [quotationId]);
  
  for (const item of items) {
    await executor.query(
      `INSERT INTO quotation_items 
        (quotation_id, service_name, description, hsn_sac, quantity, unit, rate, discount_percentage, tax_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [quotationId, item.service_name, item.description, item.hsn_sac, item.quantity, item.unit, item.rate, item.discount_percentage, item.tax_percentage]
    );
  }
};

const deleteQuotation = async (tenantId, quotationId) => {
  const result = await db.query(
    `DELETE FROM accounting_quotations WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, quotationId]
  );
  return result.rows[0];
};

module.exports = {
  createQuotation,
  getQuotationById,
  listQuotations,
  updateQuotationStatus,
  replaceQuotationItems,
  deleteQuotation
};
