const db = require('../../database');
const scopeHelper = require('../../utils/scopeHelper');

/**
 * Checks if employee ID is already taken.
 * @param {string} tenantId 
 * @param {string} employeeId 
 * @param {string|null} excludeId - Exclude a specific team leader profile ID
 * @param {import('pg').PoolClient} [client] - Optional transactional database client
 * @returns {Promise<boolean>} True if employee ID exists, else false
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
 * Creates a team leader profile entry.
 */
const createLeader = async (tenantId, userId, teamId, data, client = db) => {
  const queryText = `
    INSERT INTO team_leaders (tenant_id, user_id, team_id, employee_id, designation, performance_score)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const params = [
    tenantId,
    userId,
    teamId,
    data.employee_id || null,
    data.designation || 'Team Leader',
    data.performance_score !== undefined ? data.performance_score : 90
  ];
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

/**
 * Finds a leader by profile ID.
 */
const findLeaderById = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    SELECT tl.*, t.team_name, t.department, t.branch_id, u.first_name || ' ' || u.last_name as name, u.email, u.phone, u.status
    FROM team_leaders tl
    JOIN users u ON tl.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN teams t ON tl.team_id = t.id AND t.deleted_at IS NULL
    WHERE tl.id = $1 AND tl.tenant_id = $2
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  
  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Lists all active team leaders.
 */
const findAllLeaders = async (tenantId, filters, client = db) => {
  const { page = 1, limit = 10, search, branch_id, status } = filters;
  const params = [tenantId];
  let filterConditions = 'WHERE tl.tenant_id = $1 AND u.deleted_at IS NULL';
  
  // Ensure the team leader belongs to an active (non-deleted) branch via their team
  filterConditions += ` AND EXISTS (SELECT 1 FROM teams t2 JOIN branches b2 ON t2.branch_id = b2.id WHERE t2.id = tl.team_id AND b2.deleted_at IS NULL AND t2.deleted_at IS NULL)`;
  
  filterConditions += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });

  if (branch_id) {
    params.push(branch_id);
    filterConditions += ` AND t.branch_id = $${params.length}`;
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
      tl.employee_id ILIKE $${searchIdx} OR
      t.team_name ILIKE $${searchIdx}
    )`;
  }

  const countQuery = `
    SELECT COUNT(*) 
    FROM team_leaders tl
    JOIN users u ON tl.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN teams t ON tl.team_id = t.id AND t.deleted_at IS NULL
    ${filterConditions}
  `;
  const countRes = await client.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10);

  let selectQuery = `
    SELECT tl.*, t.team_name, t.department, t.branch_id, u.first_name || ' ' || u.last_name as name, u.email, u.phone, u.status,
           (SELECT COUNT(*) FROM developers d WHERE d.team_id = tl.team_id) as developer_count
    FROM team_leaders tl
    JOIN users u ON tl.user_id = u.id AND u.deleted_at IS NULL
    LEFT JOIN teams t ON tl.team_id = t.id AND t.deleted_at IS NULL
    ${filterConditions}
    ORDER BY tl.created_at DESC
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
 * Updates team leader profile fields.
 */
const updateLeader = async (id, tenantId, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findLeaderById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 3}`);
  const params = [id, tenantId, ...keys.map(key => data[key])];

  let queryText = `
    UPDATE team_leaders
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
  `;
  // Add subquery scope for UPDATE since we can't easily join
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
 * Soft deletes team leader profile and deactivates associated user account.
 */
const softDeleteLeader = async (id, tenantId, client = db) => {
  // 1. Get associated user_id
  const leaderQuery = 'SELECT user_id FROM team_leaders WHERE id = $1 AND tenant_id = $2';
  const leaderRes = await client.query(leaderQuery, [id, tenantId]);
  if (leaderRes.rows.length === 0) {
    return false;
  }
  const userId = leaderRes.rows[0].user_id;

  // 2. Soft-delete user and set status to 'Inactive'
  const userDeleteQuery = `
    UPDATE users
    SET deleted_at = NOW(), status = 'Inactive', updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  await client.query(userDeleteQuery, [userId, tenantId]);

  // 3. Delete team leader profile record
  const params = [id, tenantId];
  let profileDeleteQuery = 'DELETE FROM team_leaders WHERE id = $1 AND tenant_id = $2';
  
  const scopeCondition = scopeHelper.getScopeCondition(params, '', { branchColumn: 'branch_id', teamColumn: 'id' });
  if (scopeCondition && scopeCondition !== ' AND 1=0 ' && scopeCondition !== '') {
     profileDeleteQuery += ` AND team_id IN (SELECT id FROM teams WHERE tenant_id = $2 ${scopeCondition})`;
  } else if (scopeCondition === ' AND 1=0 ') {
     profileDeleteQuery += scopeCondition;
  }
  
  const { rowCount } = await client.query(profileDeleteQuery, params);

  return rowCount > 0;
};

/**
 * Gets a developer by profile ID.
 */
const getDeveloperById = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    SELECT d.*, t.branch_id, u.deleted_at
    FROM developers d
    JOIN users u ON d.user_id = u.id
    JOIN teams t ON d.team_id = t.id
    WHERE d.id = $1 AND d.tenant_id = $2
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  
  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Assigns developers to a team.
 */
const assignDevelopersToTeam = async (teamId, developerIds, tenantId, client = db) => {
  const queryText = `
    UPDATE developers
    SET team_id = $1, updated_at = NOW()
    WHERE id = ANY($2) AND tenant_id = $3
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [teamId, developerIds, tenantId]);
  return rows;
};

/**
 * Lists developers in a team.
 */
const getDevelopersByTeam = async (teamId, tenantId, client = db) => {
  const params = [teamId, tenantId];
  let queryText = `
    SELECT d.id, d.employee_id, d.skills, d.experience_years as experience, d.joining_date, d.created_at,
           u.first_name || ' ' || u.last_name as name, u.email, u.phone, u.status, t.team_name as current_team
    FROM developers d
    JOIN users u ON d.user_id = u.id AND u.deleted_at IS NULL
    JOIN teams t ON d.team_id = t.id AND t.deleted_at IS NULL
    WHERE d.team_id = $1 AND d.tenant_id = $2
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  
  const { rows } = await client.query(queryText, params);
  return rows;
};

/**
 * Gets task completed/pending count for team's developers.
 */
const getTeamTaskMetrics = async (teamId, tenantId, client = db) => {
  const params = [teamId, tenantId];
  let queryText = `
    SELECT 
      COUNT(tasks.id) as total_tasks,
      COUNT(CASE WHEN tasks.status = 'Done' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN tasks.status IN ('Open', 'Pending', 'In Progress') THEN 1 END) as pending_tasks
    FROM developers d
    JOIN teams t ON d.team_id = t.id
    LEFT JOIN tasks ON d.id = tasks.assigned_to_id AND tasks.deleted_at IS NULL
    WHERE d.team_id = $1 AND d.tenant_id = $2
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

/**
 * Gets dashboard summary stats for a team.
 */
const getTeamDashboardStats = async (teamId, tenantId, client = db) => {
  // Each query needs its own params array: the scope helper appends
  // parameters, and pg rejects bind params a query does not reference.
  const taskParams = [teamId, tenantId];
  const scopeStrDev = scopeHelper.getScopeCondition(taskParams, 't', { branchColumn: 'branch_id', teamColumn: 'id' });

  const activityParams = [teamId, tenantId];
  const scopeStrLead = scopeHelper.getScopeCondition(activityParams, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id' });

  // 1. Tasks aggregate: Today's tasks (created today), Pending tasks, Completed tasks
  // Note: We're filtering by developers in the team.
  let tasksQuery = `
    SELECT
      COUNT(tasks.id) FILTER (WHERE DATE(tasks.created_at) = CURRENT_DATE) as today_tasks,
      COUNT(tasks.id) FILTER (WHERE tasks.status::text IN ('Open', 'Pending', 'In Progress')) as pending_tasks,
      COUNT(tasks.id) FILTER (WHERE tasks.status::text IN ('Done', 'Completed')) as completed_tasks
    FROM developers d
    JOIN teams t ON d.team_id = t.id
    LEFT JOIN tasks ON d.id = tasks.assigned_to_id AND tasks.deleted_at IS NULL
    WHERE d.team_id = $1 AND d.tenant_id = $2
  `;
  tasksQuery += scopeStrDev;

  // 2. Recent activity aggregate (last 30 days or general count based on leads assigned to team)
  let activityQuery = `
    SELECT COUNT(la.id) as recent_activity
    FROM lead_activities la
    JOIN leads l ON la.lead_id = l.id
    WHERE l.team_id = $1 AND la.tenant_id = $2 AND la.created_at >= CURRENT_DATE - INTERVAL '30 days'
  `;
  activityQuery += scopeStrLead;

  const [tasksRes, activityRes] = await Promise.all([
    client.query(tasksQuery, taskParams),
    client.query(activityQuery, activityParams)
  ]);

  const tasksData = tasksRes.rows[0] || { today_tasks: 0, pending_tasks: 0, completed_tasks: 0 };
  const activityData = activityRes.rows[0] || { recent_activity: 0 };

  return {
    todayTasks: parseInt(tasksData.today_tasks, 10) || 0,
    pendingTasks: parseInt(tasksData.pending_tasks, 10) || 0,
    completedTasks: parseInt(tasksData.completed_tasks, 10) || 0,
    recentActivity: parseInt(activityData.recent_activity, 10) || 0
  };
};

module.exports = {
  checkEmployeeIdExists,
  createLeader,
  findLeaderById,
  findAllLeaders,
  updateLeader,
  softDeleteLeader,
  getDeveloperById,
  assignDevelopersToTeam,
  getDevelopersByTeam,
  getTeamTaskMetrics,
  getTeamDashboardStats
};
