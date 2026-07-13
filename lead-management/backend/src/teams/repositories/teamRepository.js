const db = require('../../database');
const scopeHelper = require('../../utils/scopeHelper');

/**
 * Checks if a team name is already taken within the tenant.
 * @param {string} tenantId 
 * @param {string} teamName 
 * @param {string|null} excludeId - Exclude a specific team ID (useful for updates)
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<boolean>} True if team name exists, else false
 */
const checkTeamNameExists = async (tenantId, teamName, excludeId = null, client = db) => {
  let queryText = `
    SELECT id FROM teams 
    WHERE tenant_id = $1 AND UPPER(team_name) = UPPER($2) AND deleted_at IS NULL
  `;
  const params = [tenantId, teamName];

  if (excludeId) {
    params.push(excludeId);
    queryText += ` AND id != $3`;
  }

  const { rows } = await client.query(queryText, params);
  return rows.length > 0;
};

/**
 * Creates a new team.
 * @param {string} tenantId 
 * @param {object} data - { branch_id, team_name, department }
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<object>} Created team
 */
const createTeam = async (tenantId, data, client = db) => {
  const queryText = `
    INSERT INTO teams (tenant_id, branch_id, team_name, department)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const params = [
    tenantId,
    data.branch_id,
    data.team_name,
    data.department || null
  ];
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

/**
 * Find a specific team by ID.
 * @param {string} id 
 * @param {string} tenantId 
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<object|null>} Team record or null
 */
const findTeamById = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    SELECT t.*, b.branch_name, tl.id as team_leader_profile_id, tl.employee_id as leader_employee_id, tl.designation as leader_designation, tl.performance_score, u.first_name || ' ' || u.last_name as leader_name, u.email as leader_email
    FROM teams t
    LEFT JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
    LEFT JOIN team_leaders tl ON t.id = tl.team_id
    LEFT JOIN users u ON tl.user_id = u.id AND u.deleted_at IS NULL
    WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id', allowDeveloperTeamScope: true });
  
  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Lists all active teams under a tenant.
 * @param {string} tenantId 
 * @param {object} filters - { page, limit, search, branch_id, department }
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<{ rows: Array, total: number }>}
 */
const findAllTeams = async (tenantId, filters, client = db) => {
  const { page = 1, limit = 10, search, branch_id, department, has_leader } = filters;
  const params = [tenantId];
  let filterConditions = 'WHERE t.tenant_id = $1 AND t.deleted_at IS NULL';
  
  // Ensure the team belongs to an active (non-deleted) branch
  filterConditions += ` AND EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = t.branch_id AND b2.deleted_at IS NULL)`;

  filterConditions += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id', allowDeveloperTeamScope: true });

  if (branch_id) {
    params.push(branch_id);
    filterConditions += ` AND t.branch_id = $${params.length}`;
  }

  if (department) {
    params.push(department);
    filterConditions += ` AND t.department = $${params.length}`;
  }

  // Only teams with an active (non-deleted) leader — used by the Team Leaders page
  // so teams whose leader was removed never render as "N/A" rows.
  if (has_leader === 'true') {
    filterConditions += ` AND EXISTS (
      SELECT 1 FROM team_leaders tl2
      JOIN users u2 ON tl2.user_id = u2.id AND u2.deleted_at IS NULL
      WHERE tl2.team_id = t.id
    )`;
  }

  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    filterConditions += ` AND (
      t.team_name ILIKE $${searchIdx} OR
      t.department ILIKE $${searchIdx}
    )`;
  }

  // 1. Get total match count
  const countQuery = `SELECT COUNT(*) FROM teams t ${filterConditions}`;
  const countRes = await client.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10);

  // 2. Fetch paginated list with leader details
  let selectQuery = `
    SELECT t.*, b.branch_name, tl.id as team_leader_profile_id, tl.performance_score, tl.employee_id as leader_employee_id, tl.designation as leader_designation, u.first_name || ' ' || u.last_name as leader_name, u.email as leader_email,
           (SELECT COUNT(*) FROM developers d WHERE d.team_id = t.id) as developer_count,
           (SELECT COUNT(*) FROM leads l WHERE l.team_id = t.id AND l.deleted_at IS NULL AND l.status::text NOT IN ('Closed Won', 'Closed Lost')) as active_leads,
           (SELECT COUNT(*) FROM tasks tk JOIN leads l ON tk.lead_id = l.id WHERE l.team_id = t.id AND tk.deleted_at IS NULL AND tk.status = 'Done') as completed_tasks,
           (SELECT COUNT(*) FROM tasks tk JOIN leads l ON tk.lead_id = l.id WHERE l.team_id = t.id AND tk.deleted_at IS NULL AND tk.status IN ('Open', 'Pending', 'In Progress')) as pending_tasks
    FROM teams t
    LEFT JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
    LEFT JOIN team_leaders tl ON t.id = tl.team_id
    LEFT JOIN users u ON tl.user_id = u.id AND u.deleted_at IS NULL
    ${filterConditions}
    ORDER BY t.created_at DESC
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
 * Updates team fields.
 * @param {string} id 
 * @param {string} tenantId 
 * @param {object} data - { team_name, department, branch_id }
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<object|null>} Updated team record
 */
const updateTeam = async (id, tenantId, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findTeamById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 3}`);
  const params = [id, tenantId, ...keys.map(key => data[key])];

  let queryText = `
    UPDATE teams
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, '', { branchColumn: 'branch_id', teamColumn: 'id' });
  queryText += ' RETURNING *';

  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Soft deletes a team record.
 * @param {string} id 
 * @param {string} tenantId 
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<boolean>} True if deleted, else false
 */
const softDeleteTeam = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    UPDATE teams
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, '', { branchColumn: 'branch_id', teamColumn: 'id' });
  queryText += ' RETURNING *';
  const { rows } = await client.query(queryText, params);
  return rows.length > 0;
};

/**
 * Get system-wide counts.
 */
const getTeamStatistics = async (tenantId, client = db) => {
  const params = [tenantId];
  const tScope = scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  
  // Note: For statistics, we apply the same scope across the subqueries to restrict branch admin/team leader visibility
  // Using a simplified query builder approach for these aggregates
  const queryText = `
    SELECT 
      (SELECT COUNT(*) FROM teams t JOIN branches b ON t.branch_id = b.id WHERE t.tenant_id = $1 AND t.deleted_at IS NULL AND b.deleted_at IS NULL ${tScope}) as total_teams,
      (SELECT COUNT(*) FROM team_leaders tl JOIN teams t ON tl.team_id = t.id JOIN branches b ON t.branch_id = b.id JOIN users u ON tl.user_id = u.id WHERE tl.tenant_id = $1 AND u.deleted_at IS NULL AND b.deleted_at IS NULL ${tScope}) as total_team_leaders,
      (SELECT COUNT(*) FROM developers d JOIN teams t ON d.team_id = t.id JOIN branches b ON t.branch_id = b.id JOIN users u ON d.user_id = u.id WHERE d.tenant_id = $1 AND u.deleted_at IS NULL AND b.deleted_at IS NULL ${tScope}) as total_developers,
      (SELECT COALESCE(AVG(performance_score), 0) FROM team_leaders tl JOIN teams t ON tl.team_id = t.id JOIN branches b ON t.branch_id = b.id JOIN users u ON tl.user_id = u.id WHERE tl.tenant_id = $1 AND u.deleted_at IS NULL AND b.deleted_at IS NULL ${tScope}) as average_performance
  `;
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

/**
 * Branch-wise team distribution.
 */
const getBranchWiseCount = async (tenantId, client = db) => {
  const params = [tenantId];
  let queryText = `
    SELECT b.branch_name as name, COUNT(t.id) as count
    FROM teams t
    JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
    WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  queryText += ` GROUP BY b.branch_name`;
  
  const { rows } = await client.query(queryText, params);
  return rows;
};

/**
 * Department-wise team distribution.
 */
const getDepartmentWiseCount = async (tenantId, client = db) => {
  const params = [tenantId];
  let queryText = `
    SELECT COALESCE(t.department, 'Unassigned') as name, COUNT(t.id) as count
    FROM teams t
    JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
    WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  queryText += ` GROUP BY t.department`;
  
  const { rows } = await client.query(queryText, params);
  return rows;
};

module.exports = {
  checkTeamNameExists,
  createTeam,
  findTeamById,
  findAllTeams,
  updateTeam,
  softDeleteTeam,
  getTeamStatistics,
  getBranchWiseCount,
  getDepartmentWiseCount
};
