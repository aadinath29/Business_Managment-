const db = require('../../database');

// === Project Verification ===

const findCompletedProjectByLeadId = async (leadId, tenantId) => {
  const queryText = `
    SELECT * FROM projects
    WHERE lead_id = $1 AND tenant_id = $2 AND status = 'Completed'
  `;
  const { rows } = await db.query(queryText, [leadId, tenantId]);
  return rows.length ? rows[0] : null;
};

// === Delivery Operations ===

const createDelivery = async (tenantId, leadId, data, client = db) => {
  const queryText = `
    INSERT INTO lead_deliveries (
      tenant_id, lead_id, go_live_date, uat_status,
      documentation_status, acceptance_status, handover_completed,
      deployment_date, remarks
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const values = [
    tenantId,
    leadId,
    data.go_live_date || null,
    data.uat_status || 'Pending',
    data.documentation_status || 'Pending',
    data.acceptance_status || 'Pending',
    data.handover_completed || false,
    data.deployment_date || null,
    data.remarks || null
  ];
  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const findDeliveryById = async (id, tenantId) => {
  const queryText = `
    SELECT ld.*, l.team_id, l.assigned_sales_user_id
    FROM lead_deliveries ld
    JOIN leads l ON ld.lead_id = l.id
    WHERE ld.id = $1 AND ld.tenant_id = $2 AND l.deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findDeliveryByLeadId = async (leadId, tenantId) => {
  const queryText = `
    SELECT ld.*, l.team_id, l.assigned_sales_user_id
    FROM lead_deliveries ld
    JOIN leads l ON ld.lead_id = l.id
    WHERE ld.lead_id = $1 AND ld.tenant_id = $2 AND l.deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [leadId, tenantId]);
  return rows.length ? rows[0] : null;
};

const updateDelivery = async (id, tenantId, data, client = db) => {
  const fields = [];
  const values = [];
  let index = 1;

  Object.entries(data).forEach(([key, val]) => {
    fields.push(`${key} = $${index}`);
    values.push(val);
    index++;
  });

  values.push(id, tenantId);
  const queryText = `
    UPDATE lead_deliveries
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${index} AND tenant_id = $${index + 1}
    RETURNING *
  `;

  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const deleteDelivery = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM lead_deliveries
    WHERE id = $1 AND tenant_id = $2
    RETURNING id
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length > 0;
};

const findAllDeliveries = async (tenantId, filters) => {
  const values = [tenantId];
  let queryText = `
    SELECT ld.*, 
           l.name as lead_name, l.branch_id, l.team_id,
           b.branch_name, t.team_name
    FROM lead_deliveries ld
    JOIN leads l ON ld.lead_id = l.id AND l.deleted_at IS NULL
    LEFT JOIN branches b ON l.branch_id = b.id AND b.deleted_at IS NULL
    LEFT JOIN teams t ON l.team_id = t.id AND t.deleted_at IS NULL
    WHERE ld.tenant_id = $1
  `;
  let index = 2;

  if (filters.delivery_status) {
    queryText += ` AND (ld.uat_status = $${index} OR ld.acceptance_status = $${index} OR ld.remarks LIKE $${index + 1})`;
    values.push(filters.delivery_status, `%${filters.delivery_status}%`);
    index += 2;
  }

  if (filters.branch_id) {
    queryText += ` AND l.branch_id = $${index}`;
    values.push(filters.branch_id);
    index++;
  }

  if (filters.team_id) {
    queryText += ` AND l.team_id = $${index}`;
    values.push(filters.team_id);
    index++;
  }

  if (filters.start_date) {
    queryText += ` AND ld.go_live_date >= $${index}`;
    values.push(filters.start_date);
    index++;
  }

  if (filters.end_date) {
    queryText += ` AND ld.go_live_date <= $${index}`;
    values.push(filters.end_date);
    index++;
  }

  if (filters.team) { // TL boundary filter
    queryText += ` AND l.team_id = $${index}`;
    values.push(filters.team);
    index++;
  }

  if (filters.developer) { // Dev boundary filter
    queryText += ` AND l.assigned_sales_user_id = $${index}`;
    values.push(filters.developer);
    index++;
  }

  // Count total matching rows
  const countQuery = `SELECT COUNT(*)::integer FROM (${queryText}) as count_table`;
  const countResult = await db.query(countQuery, values);
  const total = countResult.rows[0].count;

  // Sorting & Pagination
  const sortBy = filters.sort_by || 'created_at';
  const sortOrder = filters.sort_order || 'DESC';
  queryText += ` ORDER BY ld.${sortBy} ${sortOrder}`;

  const limit = filters.limit || 10;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  queryText += ` LIMIT $${index} OFFSET $${index + 1}`;
  values.push(limit, offset);

  const { rows } = await db.query(queryText, values);
  return { rows, total };
};

// === Customer Success Operations ===

const createCustomerSuccess = async (tenantId, leadId, data, client = db) => {
  const queryText = `
    INSERT INTO customer_success (
      tenant_id, lead_id, support_status, renewal_date,
      health_score, nps, feedback, upsell_opportunity,
      renewal_status, amc_details
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const values = [
    tenantId,
    leadId,
    data.support_status || 'Pending',
    data.renewal_date || null,
    data.health_score !== undefined ? data.health_score : null,
    data.nps !== undefined ? data.nps : null,
    data.feedback || null,
    data.upsell_opportunity || false,
    data.renewal_status || 'Pending',
    data.amc_details || null
  ];
  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const findCSById = async (id, tenantId) => {
  const queryText = `
    SELECT cs.*, l.team_id, l.assigned_sales_user_id
    FROM customer_success cs
    JOIN leads l ON cs.lead_id = l.id
    WHERE cs.id = $1 AND cs.tenant_id = $2 AND l.deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findCSByLeadId = async (leadId, tenantId) => {
  const queryText = `
    SELECT cs.*, l.team_id, l.assigned_sales_user_id
    FROM customer_success cs
    JOIN leads l ON cs.lead_id = l.id
    WHERE cs.lead_id = $1 AND cs.tenant_id = $2 AND l.deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [leadId, tenantId]);
  return rows.length ? rows[0] : null;
};

const updateCustomerSuccess = async (id, tenantId, data, client = db) => {
  const fields = [];
  const values = [];
  let index = 1;

  Object.entries(data).forEach(([key, val]) => {
    fields.push(`${key} = $${index}`);
    values.push(val);
    index++;
  });

  values.push(id, tenantId);
  const queryText = `
    UPDATE customer_success
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${index} AND tenant_id = $${index + 1}
    RETURNING *
  `;

  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const deleteCustomerSuccess = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM customer_success
    WHERE id = $1 AND tenant_id = $2
    RETURNING id
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length > 0;
};

const findAllCS = async (tenantId, filters) => {
  const values = [tenantId];
  let queryText = `
    SELECT cs.*, 
           l.name as lead_name, l.branch_id, l.team_id,
           b.branch_name, t.team_name
    FROM customer_success cs
    JOIN leads l ON cs.lead_id = l.id AND l.deleted_at IS NULL
    LEFT JOIN branches b ON l.branch_id = b.id AND b.deleted_at IS NULL
    LEFT JOIN teams t ON l.team_id = t.id AND t.deleted_at IS NULL
    WHERE cs.tenant_id = $1
  `;
  let index = 2;

  if (filters.customer_status) {
    queryText += ` AND (cs.support_status = $${index} OR cs.amc_details LIKE $${index + 1})`;
    values.push(filters.customer_status, `%${filters.customer_status}%`);
    index += 2;
  }

  if (filters.renewal_status) {
    queryText += ` AND cs.renewal_status = $${index}`;
    values.push(filters.renewal_status);
    index++;
  }

  if (filters.health_score_min !== undefined) {
    queryText += ` AND cs.health_score >= $${index}`;
    values.push(filters.health_score_min);
    index++;
  }

  if (filters.health_score_max !== undefined) {
    queryText += ` AND cs.health_score <= $${index}`;
    values.push(filters.health_score_max);
    index++;
  }

  if (filters.branch_id) {
    queryText += ` AND l.branch_id = $${index}`;
    values.push(filters.branch_id);
    index++;
  }

  if (filters.team_id) {
    queryText += ` AND l.team_id = $${index}`;
    values.push(filters.team_id);
    index++;
  }

  if (filters.team) { // TL boundary filter
    queryText += ` AND l.team_id = $${index}`;
    values.push(filters.team);
    index++;
  }

  if (filters.developer) { // Dev boundary filter
    queryText += ` AND l.assigned_sales_user_id = $${index}`;
    values.push(filters.developer);
    index++;
  }

  // Count total matching rows
  const countQuery = `SELECT COUNT(*)::integer FROM (${queryText}) as count_table`;
  const countResult = await db.query(countQuery, values);
  const total = countResult.rows[0].count;

  // Sorting & Pagination
  const sortBy = filters.sort_by || 'created_at';
  const sortOrder = filters.sort_order || 'DESC';
  queryText += ` ORDER BY cs.${sortBy} ${sortOrder}`;

  const limit = filters.limit || 10;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  queryText += ` LIMIT $${index} OFFSET $${index + 1}`;
  values.push(limit, offset);

  const { rows } = await db.query(queryText, values);
  return { rows, total };
};

module.exports = {
  findCompletedProjectByLeadId,
  createDelivery,
  findDeliveryById,
  findDeliveryByLeadId,
  updateDelivery,
  deleteDelivery,
  findAllDeliveries,
  
  createCustomerSuccess,
  findCSById,
  findCSByLeadId,
  updateCustomerSuccess,
  deleteCustomerSuccess,
  findAllCS
};
