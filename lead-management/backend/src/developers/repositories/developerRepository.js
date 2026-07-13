const db = require('../../database');
const scopeHelper = require('../../utils/scopeHelper');

/**
 * Checks if employee ID is already taken.
 */
const checkEmployeeIdExists = async (tenantId, employeeId, excludeId = null, client = db) => {
  let queryText = `
    SELECT id FROM (
      SELECT id, tenant_id, employee_id FROM team_leaders
      UNION ALL
      SELECT id, tenant_id, employee_id FROM developers
    ) combined
    WHERE tenant_id = $1 AND UPPER(employee_id) = UPPER($2)
  `;
  const params = [tenantId, employeeId];

  if (excludeId) {
    params.push(excludeId);
    queryText += ` AND id != $3`;
  }

  const { rows } = await client.query(queryText, params);
  return rows.length > 0;
};

/**
 * Inserts a developer profile record.
 */
const createDeveloperProfile = async (tenantId, userId, data, client = db) => {
  const queryText = `
    INSERT INTO developers (tenant_id, user_id, team_id, employee_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const params = [
    tenantId,
    userId,
    data.teamId,
    data.employeeId
  ];
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

/**
 * Finds a developer by profile ID.
 */
const findDeveloperById = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.status, u.deleted_at
    FROM developers d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE d.id = $1 AND d.tenant_id = $2
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Finds a developer profile by user ID.
 */
const findDeveloperByUserId = async (userId, tenantId, client = db) => {
  const params = [userId, tenantId];
  let queryText = `
    SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.status, u.deleted_at
    FROM developers d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN teams t ON d.team_id = t.id
    WHERE d.user_id = $1 AND d.tenant_id = $2
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Finds full developer profile details (joins user, team, branch, and role - no password hash).
 */
const findDeveloperProfile = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    SELECT d.id, d.employee_id, d.created_at, d.updated_at,
           u.first_name || ' ' || u.last_name as name, u.email, u.phone, u.status, u.created_at as user_created_at,
           r.name as role_name, t.id as team_id, t.team_name, t.department, b.id as branch_id, b.branch_name
    FROM developers d
    JOIN users u ON d.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    JOIN teams t ON d.team_id = t.id AND t.deleted_at IS NULL
    JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
    WHERE d.id = $1 AND d.tenant_id = $2 AND u.deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Lists developers under a tenant.
 */
const findAllDevelopers = async (tenantId, filters, client = db) => {
  const { page = 1, limit = 10, search, team_id, status } = filters;
  const params = [tenantId];
  let filterConditions = 'WHERE d.tenant_id = $1 AND u.deleted_at IS NULL';
  
  filterConditions += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });

  if (team_id) {
    params.push(team_id);
    filterConditions += ` AND d.team_id = $${params.length}`;
  }

  if (status) {
    params.push(status);
    filterConditions += ` AND u.status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    filterConditions += ` AND (
      u.first_name ILIKE $${searchIdx} OR
      u.last_name ILIKE $${searchIdx} OR
      d.employee_id ILIKE $${searchIdx}
    )`;
  }

  const countQuery = `
    SELECT COUNT(*) 
    FROM developers d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN teams t ON d.team_id = t.id
    ${filterConditions}
  `;
  const countRes = await client.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10);

  let selectQuery = `
    SELECT d.id, d.employee_id, d.team_id, d.user_id, d.created_at, d.updated_at,
           u.first_name || ' ' || u.last_name as name, u.email, u.phone, u.status,
           t.team_name, t.department, b.branch_name
    FROM developers d
    JOIN users u ON d.user_id = u.id
    JOIN teams t ON d.team_id = t.id AND t.deleted_at IS NULL
    JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
    ${filterConditions}
    ORDER BY d.created_at DESC
  `;

  const offset = (page - 1) * limit;
  params.push(limit);
  selectQuery += ` LIMIT $${params.length}`;
  params.push(offset);
  selectQuery += ` OFFSET $${params.length}`;

  const { rows } = await client.query(selectQuery, params);

  return {
    rows,
    total
  };
};

/**
 * Updates developer details.
 */
const updateDeveloperProfile = async (id, tenantId, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findDeveloperById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 3}`);
  const params = [id, tenantId, ...keys.map(key => data[key])];

  let queryText = `
    UPDATE developers
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
  `;
  // Add subquery scope for UPDATE
  const scopeCondition = scopeHelper.getScopeCondition(params, '', { branchColumn: 'branch_id', teamColumn: 'id' });
  if (scopeCondition && scopeCondition !== ' AND 1=0 ' && scopeCondition !== '') {
     queryText += ` AND team_id IN (SELECT id FROM teams WHERE tenant_id = $2 ${scopeCondition})`;
  } else if (scopeCondition === ' AND 1=0 ') {
     queryText += scopeCondition;
  }
  queryText += ' RETURNING *';

  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Soft deletes a developer profile and user account.
 */
const softDeleteDeveloper = async (id, tenantId, client = db) => {
  // 1. Get associated user_id
  const devQuery = 'SELECT user_id FROM developers WHERE id = $1 AND tenant_id = $2';
  const devRes = await client.query(devQuery, [id, tenantId]);
  if (devRes.rows.length === 0) {
    return false;
  }
  const userId = devRes.rows[0].user_id;

  // 2. Soft delete user and set status to 'Inactive'
  const userDeleteQuery = `
    UPDATE users
    SET deleted_at = NOW(), status = 'Inactive', updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  await client.query(userDeleteQuery, [userId, tenantId]);

  // 3. Delete developer profile record
  const params = [id, tenantId];
  let profileDeleteQuery = 'DELETE FROM developers WHERE id = $1 AND tenant_id = $2';
  
  const scopeCondition = scopeHelper.getScopeCondition(params, '', { branchColumn: 'branch_id', teamColumn: 'id' });
  if (scopeCondition && scopeCondition !== ' AND 1=0 ' && scopeCondition !== '') {
     profileDeleteQuery += ` AND team_id IN (SELECT id FROM teams WHERE tenant_id = $2 ${scopeCondition})`;
  } else if (scopeCondition === ' AND 1=0 ') {
     profileDeleteQuery += scopeCondition;
  }
  
  const { rowCount } = await client.query(profileDeleteQuery, params);

  return rowCount > 0;
};

module.exports = {
  checkEmployeeIdExists,
  createDeveloperProfile,
  findDeveloperById,
  findDeveloperByUserId,
  findDeveloperProfile,
  findAllDevelopers,
  updateDeveloperProfile,
  softDeleteDeveloper
};
