const db = require('../../database');

const createInvoice = async (tenantId, invoiceData, items, client) => {
  const executor = client || db;
  const {
    lead_id,
    proforma_id,
    invoice_number,
    invoice_date,
    due_date,
    invoice_type,
    place_of_supply,
    currency,
    status
  } = invoiceData;

  const result = await executor.query(
    `INSERT INTO accounting_invoices 
      (tenant_id, lead_id, proforma_id, invoice_number, invoice_date, due_date, invoice_type, place_of_supply, currency, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [tenantId, lead_id, proforma_id, invoice_number, invoice_date, due_date, invoice_type, place_of_supply, currency, status]
  );
  
  const invoice = result.rows[0];

  for (const item of items) {
    await executor.query(
      `INSERT INTO invoice_items 
        (invoice_id, service_name, description, hsn_sac, quantity, unit, rate, discount_percentage, tax_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [invoice.id, item.service_name, item.description, item.hsn_sac, item.quantity, item.unit, item.rate, item.discount_percentage, item.tax_percentage]
    );
  }

  const updatedInvoice = await executor.query(
    'SELECT * FROM accounting_invoices WHERE id = $1',
    [invoice.id]
  );

  return updatedInvoice.rows[0];
};

const getInvoiceById = async (tenantId, invoiceId) => {
  const result = await db.query(
    `SELECT * FROM accounting_invoices WHERE tenant_id = $1 AND id = $2`,
    [tenantId, invoiceId]
  );
  if (result.rows.length === 0) return null;

  const itemsResult = await db.query(
    `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC`,
    [invoiceId]
  );

  const invoice = result.rows[0];
  invoice.items = itemsResult.rows;
  return invoice;
};

const listInvoices = async (tenantId, filters, page, limit) => {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM accounting_invoices WHERE tenant_id = $1';
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
  if (filters.invoice_type) {
    paramCount++;
    query += ` AND invoice_type = $${paramCount}`;
    params.push(filters.invoice_type);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  
  let countQuery = 'SELECT COUNT(*) FROM accounting_invoices WHERE tenant_id = $1';
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
  if (filters.invoice_type) {
    countParamCount++;
    countQuery += ` AND invoice_type = $${countParamCount}`;
    countParams.push(filters.invoice_type);
  }
  
  const countResult = await db.query(countQuery, countParams);

  return {
    data: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit
  };
};

module.exports = {
  createInvoice,
  getInvoiceById,
  listInvoices
};
