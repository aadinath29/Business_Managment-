const db = require('../../database');
const scopeHelper = require('../../utils/scopeHelper');

/**
 * Checks if a branch code is already taken within the tenant.
 * @param {string} tenantId 
 * @param {string} branchCode 
 * @param {string|null} excludeId - Exclude a specific branch ID (useful for updates)
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<boolean>} True if code exists, else false
 */
const checkBranchCodeExists = async (tenantId, branchCode, excludeId = null, client = db) => {
  let queryText = `
    SELECT id FROM branches 
    WHERE tenant_id = $1 AND UPPER(branch_code) = UPPER($2) AND deleted_at IS NULL
  `;
  const params = [tenantId, branchCode];

  if (excludeId) {
    params.push(excludeId);
    queryText += ` AND id != $3`;
  }

  const { rows } = await client.query(queryText, params);
  return rows.length > 0;
};

/**
 * Creates a new branch in the database.
 * @param {string} tenantId 
 * @param {object} data 
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<object>} Created branch
 */
const create = async (tenantId, data, client = db) => {
  const fields = [
    'tenant_id', 'branch_name', 'branch_code', 'company_name',
    'company_location', 'country', 'state', 'city', 'address',
    'phone', 'email', 'assigned_target', 'achieved_target',
    'description', 'status', 'manager_id'
  ];

  const params = [
    tenantId,
    data.branch_name,
    data.branch_code,
    data.company_name || null,
    data.company_location || null,
    data.country || null,
    data.state || null,
    data.city || null,
    data.address || null,
    data.phone || null,
    data.email || null,
    data.assigned_target || 0,
    data.achieved_target || 0,
    data.description || null,
    'Active',
    data.manager_id || null
  ];

  const queryText = `
    INSERT INTO branches (${fields.join(', ')})
    VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')})
    RETURNING *
  `;

  const { rows } = await client.query(queryText, params);
  return rows[0];
};

/**
 * Find a specific branch by ID.
 * @param {string} id 
 * @param {string} tenantId 
 * @returns {Promise<object|null>}
 */
// Shared projection: branch row + live manager identity + computed operational counts.
// These are always derived — never entered manually.
const BRANCH_SELECT = `
  SELECT b.*,
         mu.first_name || ' ' || mu.last_name AS manager_name,
         mu.email AS manager_email,
         mu.phone AS manager_phone,
         (SELECT COUNT(*) FROM leads l
            WHERE l.branch_id = b.id AND l.deleted_at IS NULL
              AND l.status::text NOT IN ('Closed Won', 'Closed Lost')) AS active_leads,
         (SELECT COUNT(*) FROM projects p
            JOIN leads pl ON p.lead_id = pl.id AND pl.deleted_at IS NULL
            WHERE pl.branch_id = b.id
              AND p.status::text IN ('Not Started', 'In Progress', 'On Hold')) AS active_projects,
         (SELECT COUNT(*) FROM team_leaders tl
            JOIN teams t ON tl.team_id = t.id AND t.deleted_at IS NULL
            JOIN users tu ON tl.user_id = tu.id AND tu.deleted_at IS NULL
            WHERE t.branch_id = b.id)
         + (SELECT COUNT(*) FROM developers d
            JOIN teams dt ON d.team_id = dt.id AND dt.deleted_at IS NULL
            JOIN users du ON d.user_id = du.id AND du.deleted_at IS NULL
            WHERE dt.branch_id = b.id) AS employee_count
  FROM branches b
  LEFT JOIN users mu ON b.manager_id = mu.id AND mu.deleted_at IS NULL
`;

const findById = async (id, tenantId) => {
  const params = [id, tenantId];
  let queryText = `
    ${BRANCH_SELECT}
    WHERE b.id = $1 AND b.tenant_id = $2 AND b.deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, 'b', { branchColumn: 'id', teamColumn: null });

  const { rows } = await db.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Find the assigned branch ID for a Team Leader.
 * @param {string} userId 
 * @returns {Promise<string|null>} branch_id
 */
const findTeamLeaderAssignedBranchId = async (userId) => {
  const queryText = `
    SELECT t.branch_id 
    FROM team_leaders tl
    JOIN teams t ON tl.team_id = t.id
    WHERE tl.user_id = $1
  `;
  const { rows } = await db.query(queryText, [userId]);
  return rows.length ? rows[0].branch_id : null;
};

/**
 * Find the assigned branch ID for a Branch Manager (Admin).
 * @param {string} userId 
 * @returns {Promise<string|null>} branch_id
 */
const findManagerAssignedBranchId = async (userId) => {
  const queryText = `
    SELECT id 
    FROM branches 
    WHERE manager_id = $1 AND deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [userId]);
  return rows.length ? rows[0].id : null;
};

/**
 * Lists all active branches with filtering, sorting, and pagination.
 * @param {string} tenantId 
 * @param {object} filters 
 * @returns {Promise<{ rows: Array, total: number }>}
 */
const findAll = async (tenantId, filters) => {
  const { page = 1, limit = 10, search, status, city, state, sortBy, sortOrder } = filters;

  const params = [tenantId];
  let filterConditions = 'WHERE b.tenant_id = $1 AND b.deleted_at IS NULL';

  filterConditions += scopeHelper.getScopeCondition(params, 'b', { branchColumn: 'id', teamColumn: null });

  if (status) {
    params.push(status);
    filterConditions += ` AND b.status = $${params.length}`;
  }

  if (city) {
    params.push(city);
    filterConditions += ` AND b.city = $${params.length}`;
  }

  if (state) {
    params.push(state);
    filterConditions += ` AND b.state = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    filterConditions += ` AND (
      b.branch_name ILIKE $${searchIdx} OR
      b.branch_code ILIKE $${searchIdx} OR
      b.company_name ILIKE $${searchIdx} OR
      b.city ILIKE $${searchIdx}
    )`;
  }

  // 1. Get total match count
  const countQuery = `SELECT COUNT(*) FROM branches b ${filterConditions}`;
  const countRes = await db.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10);

  // 2. Fetch paginated list
  const validSortColumns = ['created_at', 'branch_name', 'branch_code', 'city', 'state', 'health_score', 'assigned_target'];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const sortDir = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let selectQuery = `
    ${BRANCH_SELECT}
    ${filterConditions}
    ORDER BY b.${sortCol} ${sortDir}
  `;

  const offset = (page - 1) * limit;
  params.push(limit);
  selectQuery += ` LIMIT $${params.length}`;
  params.push(offset);
  selectQuery += ` OFFSET $${params.length}`;

  const { rows } = await db.query(selectQuery, params);

  return {
    rows,
    total
  };
};

/**
 * Partially updates an existing branch.
 * @param {string} id 
 * @param {string} tenantId 
 * @param {object} data 
 * @returns {Promise<object|null>} Updated branch
 */
const update = async (id, tenantId, data) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findById(id, tenantId);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 3}`);
  const params = [id, tenantId, ...keys.map(key => data[key])];

  let queryText = `
    UPDATE branches
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, '', { branchColumn: 'id', teamColumn: null });
  queryText += ' RETURNING *';

  const { rows } = await db.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Soft deletes a branch by setting deleted_at = NOW().
 * @param {string} id 
 * @param {string} tenantId 
 * @returns {Promise<boolean>} True if deleted, else false
 */
const softDelete = async (id, tenantId) => {
  const params = [id, tenantId];
  let queryText = `
    UPDATE branches
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, '', { branchColumn: 'id', teamColumn: null });
  queryText += ' RETURNING *';
  
  const { rows } = await db.query(queryText, params);
  return rows.length > 0;
};

module.exports = {
  checkBranchCodeExists,
  create,
  findById,
  findTeamLeaderAssignedBranchId,
  findManagerAssignedBranchId,
  findAll,
  update,
  softDelete
};
