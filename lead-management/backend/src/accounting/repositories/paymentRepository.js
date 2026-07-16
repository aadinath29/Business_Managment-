const db = require('../../database');

const recordPayment = async (tenantId, invoiceId, data) => {
  const {
    payment_date,
    payment_mode,
    transaction_number,
    amount_received,
    bank_name,
    received_by,
    document_url,
    notes
  } = data;

  const result = await db.query(
    `INSERT INTO accounting_payments 
      (tenant_id, invoice_id, payment_date, payment_mode, transaction_number, amount_received, bank_name, received_by, document_url, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [tenantId, invoiceId, payment_date, payment_mode, transaction_number, amount_received, bank_name, received_by, document_url, notes]
  );
  
  return result.rows[0];
};

const getPaymentsByInvoiceId = async (tenantId, invoiceId) => {
  const result = await db.query(
    `SELECT * FROM accounting_payments WHERE tenant_id = $1 AND invoice_id = $2 ORDER BY payment_date DESC`,
    [tenantId, invoiceId]
  );
  return result.rows;
};

const deletePayment = async (tenantId, paymentId) => {
  const result = await db.query(
    `DELETE FROM accounting_payments WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, paymentId]
  );
  return result.rows[0];
};

const updatePayment = async (tenantId, paymentId, data) => {
  const setClauses = [];
  const values = [tenantId, paymentId];
  let paramIndex = 3;

  const fields = ['payment_date', 'payment_mode', 'transaction_number', 'amount_received', 'bank_name', 'received_by', 'document_url', 'notes'];
  for (const field of fields) {
    if (data[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex}`);
      values.push(data[field]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return null;

  const result = await db.query(
    `UPDATE accounting_payments 
     SET ${setClauses.join(', ')} 
     WHERE tenant_id = $1 AND id = $2 
     RETURNING *`,
    values
  );
  
  return result.rows[0];
};

module.exports = {
  recordPayment,
  getPaymentsByInvoiceId,
  updatePayment,
  deletePayment
};
