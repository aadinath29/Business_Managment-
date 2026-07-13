const db = require('../../database');

// === Lead Assignment Repository ===

const deactivatePreviousAssignments = async (leadId, tenantId, client = db) => {
  const queryText = `
    UPDATE lead_assignments
    SET is_current = false
    WHERE lead_id = $1 AND tenant_id = $2
  `;
  await client.query(queryText, [leadId, tenantId]);
};

const createAssignment = async (tenantId, leadId, assignedById, data, client = db) => {
  const queryText = `
    INSERT INTO lead_assignments (
      tenant_id, lead_id, assigned_by_id, assigned_from_user_id, 
      assigned_to_user_id, assigned_team_id, reason, assignment_type, is_current
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [
    tenantId, leadId, assignedById, data.assigned_from_user_id || null,
    data.assigned_to_user_id || null, data.assigned_team_id || null,
    data.reason || null, data.assignment_type
  ]);
  return rows[0];
};

const findCurrentAssignment = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT la.*,
           u.first_name || ' ' || u.last_name as assignee_name,
           t.team_name,
           u2.first_name || ' ' || u2.last_name as assigner_name
    FROM lead_assignments la
    LEFT JOIN users u ON la.assigned_to_user_id = u.id
    LEFT JOIN teams t ON la.assigned_team_id = t.id
    LEFT JOIN users u2 ON la.assigned_by_id = u2.id
    WHERE la.lead_id = $1 AND la.tenant_id = $2 AND la.is_current = true
    ORDER BY la.assigned_date DESC
    LIMIT 1
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows.length ? rows[0] : null;
};

const findAssignmentHistory = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT la.*,
           u.first_name || ' ' || u.last_name as assignee_name,
           t.team_name,
           u2.first_name || ' ' || u2.last_name as assigner_name,
           u3.first_name || ' ' || u3.last_name as assigner_from_name
    FROM lead_assignments la
    LEFT JOIN users u ON la.assigned_to_user_id = u.id
    LEFT JOIN teams t ON la.assigned_team_id = t.id
    LEFT JOIN users u2 ON la.assigned_by_id = u2.id
    LEFT JOIN users u3 ON la.assigned_from_user_id = u3.id
    WHERE la.lead_id = $1 AND la.tenant_id = $2
    ORDER BY la.assigned_date DESC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

// === Projects Repository ===

const createProject = async (tenantId, leadId, data, client = db) => {
  const queryText = `
    INSERT INTO projects (
      tenant_id, lead_id, project_name, team_id, developer_id,
      technology, status, progress_pct, total_cost, start_date, deadline, remarks,
      priority, risk_level, current_sprint, expected_hours
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [
    tenantId, leadId, data.project_name, data.team_id || null, data.developer_id || null,
    data.technology || null, data.status || 'Not Started', data.progress_pct || 0,
    data.total_cost || 0, data.start_date || null, data.deadline || null, data.remarks || null,
    data.priority || 'Medium', data.risk_level || 'Low', data.current_sprint || null,
    data.expected_hours || null
  ]);
  return rows[0];
};

const findProjectById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT p.*,
           l.name as lead_name,
           t.team_name,
           u.first_name || ' ' || u.last_name as developer_name,
           b.branch_name,
           b.id as branch_id
    FROM projects p
    LEFT JOIN leads l ON p.lead_id = l.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN branches b ON t.branch_id = b.id
    LEFT JOIN users u ON p.developer_id = u.id
    WHERE p.id = $1 AND p.tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findProjectByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT p.*
    FROM projects p
    WHERE p.lead_id = $1 AND p.tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows.length ? rows[0] : null;
};

const findAllProjects = async (tenantId, filters, client = db) => {
  const params = [tenantId];
  let whereClauses = ['p.tenant_id = $1'];

  if (filters.status) {
    params.push(filters.status);
    whereClauses.push(`p.status = $${params.length}`);
  }
  if (filters.team) {
    params.push(filters.team);
    whereClauses.push(`p.team_id = $${params.length}`);
  }
  if (filters.developer) {
    params.push(filters.developer);
    whereClauses.push(`p.developer_id = $${params.length}`);
  }
  if (filters.technology) {
    params.push(`%${filters.technology}%`);
    whereClauses.push(`p.technology ILIKE $${params.length}`);
  }
  if (filters.branch) {
    params.push(filters.branch);
    whereClauses.push(`t.branch_id = $${params.length}`);
  }
  if (filters.lead) {
    params.push(filters.lead);
    whereClauses.push(`p.lead_id = $${params.length}`);
  }
  if (filters.startDate) {
    params.push(filters.startDate);
    whereClauses.push(`p.start_date >= $${params.length}`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    whereClauses.push(`p.start_date <= $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    whereClauses.push(`(p.project_name ILIKE $${params.length} OR p.technology ILIKE $${params.length})`);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total matching
  const countQuery = `
    SELECT COUNT(*) as total
    FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    ${whereSql}
  `;
  const countRes = await client.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // Sorting
  const sortByMap = {
    created_at: 'p.created_at',
    project_name: 'p.project_name',
    progress_pct: 'p.progress_pct',
    status: 'p.status',
    start_date: 'p.start_date',
    deadline: 'p.deadline'
  };
  const sortCol = sortByMap[filters.sortBy] || 'p.created_at';
  const order = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  // Limit/offset pagination
  const limit = filters.limit;
  const offset = (filters.page - 1) * limit;
  params.push(limit, offset);
  
  const queryText = `
    SELECT p.*,
           l.name as lead_name,
           t.team_name,
           u.first_name || ' ' || u.last_name as developer_name,
           b.branch_name,
           b.id as branch_id
    FROM projects p
    LEFT JOIN leads l ON p.lead_id = l.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN branches b ON t.branch_id = b.id
    LEFT JOIN users u ON p.developer_id = u.id
    ${whereSql}
    ORDER BY ${sortCol} ${order}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await client.query(queryText, params);
  return { rows, total };
};

const updateProject = async (id, tenantId, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findProjectById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 3}`);
  const params = [id, tenantId, ...keys.map(key => data[key])];

  const queryText = `
    UPDATE projects
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, params);
  return rows.length ? findProjectById(id, tenantId, client) : null;
};

const deleteProject = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM projects
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rowCount } = await client.query(queryText, [id, tenantId]);
  return rowCount > 0;
};

// === Statistics SQL Aggregations ===

const getProjectStatistics = async (tenantId, client = db) => {
  // Aggregate Counts and Averages
  const overviewQuery = `
    SELECT 
      COUNT(*)::integer as total_projects,
      COUNT(CASE WHEN status = 'Completed' THEN 1 END)::integer as completed,
      COUNT(CASE WHEN status = 'In Progress' THEN 1 END)::integer as in_progress,
      COUNT(CASE WHEN status = 'Not Started' THEN 1 END)::integer as not_started,
      COUNT(CASE WHEN status = 'On Hold' THEN 1 END)::integer as on_hold,
      COUNT(CASE WHEN status = 'Cancelled' THEN 1 END)::integer as cancelled,
      ROUND(COALESCE(AVG(progress_pct), 0), 2)::numeric as average_progress,
      ROUND(COALESCE(AVG(CASE WHEN status = 'Completed' THEN progress_pct END), 0), 2)::numeric as average_completion
    FROM projects
    WHERE tenant_id = $1
  `;
  const overviewRes = await client.query(overviewQuery, [tenantId]);
  const overview = overviewRes.rows[0];

  // Group by Team
  const teamQuery = `
    SELECT p.team_id, COALESCE(t.team_name, 'Unassigned') as team_name, COUNT(*)::integer as count
    FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.tenant_id = $1
    GROUP BY p.team_id, t.team_name
  `;
  const teamRes = await client.query(teamQuery, [tenantId]);

  // Group by Branch
  const branchQuery = `
    SELECT t.branch_id, COALESCE(b.branch_name, 'Unassigned') as branch_name, COUNT(*)::integer as count
    FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN branches b ON t.branch_id = b.id
    WHERE p.tenant_id = $1
    GROUP BY t.branch_id, b.branch_name
  `;
  const branchRes = await client.query(branchQuery, [tenantId]);

  // Group by Status
  const statusQuery = `
    SELECT status, COUNT(*)::integer as count
    FROM projects
    WHERE tenant_id = $1
    GROUP BY status
  `;
  const statusRes = await client.query(statusQuery, [tenantId]);

  // Group by Technology
  const techQuery = `
    SELECT COALESCE(technology, 'Unspecified') as technology, COUNT(*)::integer as count
    FROM projects
    WHERE tenant_id = $1
    GROUP BY technology
  `;
  const techRes = await client.query(techQuery, [tenantId]);

  // Group by Month
  const monthQuery = `
    SELECT TO_CHAR(start_date, 'YYYY-MM') as month, COUNT(*)::integer as count
    FROM projects
    WHERE tenant_id = $1 AND start_date IS NOT NULL
    GROUP BY TO_CHAR(start_date, 'YYYY-MM')
    ORDER BY month ASC
  `;
  const monthRes = await client.query(monthQuery, [tenantId]);

  return {
    ...overview,
    projectsByTeam: teamRes.rows,
    projectsByBranch: branchRes.rows,
    projectsByStatus: statusRes.rows,
    projectsByTechnology: techRes.rows,
    projectsByMonth: monthRes.rows
  };
};

// === Validator check helpers ===

const findDeveloperByIdAndTeam = async (developerUserId, tenantId, client = db) => {
  const queryText = `
    SELECT d.*, u.status as user_status, u.deleted_at as user_deleted_at
    FROM developers d
    JOIN users u ON d.user_id = u.id
    WHERE d.user_id = $1 AND d.tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [developerUserId, tenantId]);
  return rows.length ? rows[0] : null;
};

const findTeamById = async (teamId, tenantId, client = db) => {
  const queryText = `
    SELECT * FROM teams
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [teamId, tenantId]);
  return rows.length ? rows[0] : null;
};

const findUserById = async (userId, tenantId, client = db) => {
  const queryText = `
    SELECT * FROM users
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [userId, tenantId]);
  return rows.length ? rows[0] : null;
};

module.exports = {
  deactivatePreviousAssignments,
  createAssignment,
  findCurrentAssignment,
  findAssignmentHistory,
  createProject,
  findProjectById,
  findProjectByLeadId,
  findAllProjects,
  updateProject,
  deleteProject,
  getProjectStatistics,
  findDeveloperByIdAndTeam,
  findTeamById,
  findUserById
};
