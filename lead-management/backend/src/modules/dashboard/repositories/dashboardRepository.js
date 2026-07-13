const db = require('../../../database');
const scopeHelper = require('../../../utils/scopeHelper');

const findTeamLeaderTeamId = async (userId, tenantId, client = db) => {
  const queryText = `
    SELECT team_id FROM team_leaders 
    WHERE user_id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [userId, tenantId]);
  return rows.length ? rows[0].team_id : null;
};

const findDeveloperId = async (userId, tenantId, client = db) => {
  const queryText = `
    SELECT id FROM developers 
    WHERE user_id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [userId, tenantId]);
  return rows.length ? rows[0].id : null;
};

const applyFilters = (params, conditions, filters, tableAlias = 'l') => {
  const { branchId, teamId, developerId, branchManagerId, leadStatus, minRevenue, maxRevenue } = filters;
  
  if (branchId) {
    params.push(branchId);
    conditions.push(`${tableAlias}.branch_id = $${params.length}`);
  }
  if (teamId) {
    params.push(teamId);
    conditions.push(`${tableAlias}.team_id = $${params.length}`);
  }
  if (developerId) {
    params.push(developerId);
    conditions.push(`${tableAlias}.assigned_sales_user_id = $${params.length}`);
  }
  if (leadStatus) {
    params.push(leadStatus);
    conditions.push(`${tableAlias}.status = $${params.length}`);
  }
  if (minRevenue !== undefined) {
    params.push(minRevenue);
    conditions.push(`${tableAlias}.expected_revenue >= $${params.length}`);
  }
  if (maxRevenue !== undefined) {
    params.push(maxRevenue);
    conditions.push(`${tableAlias}.expected_revenue <= $${params.length}`);
  }
  if (branchManagerId) {
    params.push(branchManagerId);
    conditions.push(`${tableAlias}.branch_id IN (SELECT id FROM branches WHERE branch_manager_id = $${params.length} AND deleted_at IS NULL)`);
  }
};

const getSummary = async (tenantId, filters, client = db) => {
  const { startDate, endDate } = filters;
  const isFiltered = !!(startDate && endDate);
  
  const params = [tenantId];
  const conditions = [
    'l.tenant_id = $1', 
    'l.deleted_at IS NULL',
    'EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = l.branch_id AND b2.deleted_at IS NULL)'
  ];
  
  applyFilters(params, conditions, filters, 'l');
  
  const currStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const currEnd = endDate || new Date().toISOString().split('T')[0];
  
  const durationMs = new Date(currEnd).getTime() - new Date(currStart).getTime();
  const prevStart = new Date(new Date(currStart).getTime() - durationMs).toISOString().split('T')[0];
  
  params.push(currStart, currEnd, prevStart, isFiltered);
  
  const currStartIdx = params.length - 3;
  const currEndIdx = params.length - 2;
  const prevStartIdx = params.length - 1;
  const isFilteredIdx = params.length;
  
  const scopeStr = scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  
  const queryText = `
    SELECT
      (COUNT(*) FILTER (WHERE $${isFilteredIdx} = FALSE OR (l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx})))::int AS total_leads,
      (COUNT(*) FILTER (WHERE l.status = 'Qualified' AND ($${isFilteredIdx} = FALSE OR (l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx}))))::int AS qualified_leads,
      (COUNT(*) FILTER (WHERE l.status = 'Closed Won' AND ($${isFilteredIdx} = FALSE OR (l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx}))))::int AS won_leads,
      (COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.status = 'Closed Won' AND ($${isFilteredIdx} = FALSE OR (l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx}))), 0))::numeric AS revenue,
      (COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.status NOT IN ('Closed Won', 'Closed Lost') AND ($${isFilteredIdx} = FALSE OR (l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx}))), 0))::numeric AS pipeline_value,
      (COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.status = 'Closed Won' AND ($${isFilteredIdx} = FALSE OR (l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx}))), 0))::numeric AS closed_won,
      
      (COUNT(*) FILTER (WHERE l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx}))::int AS total_leads_curr,
      (COUNT(*) FILTER (WHERE l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx} AND l.status = 'Qualified'))::int AS qualified_leads_curr,
      (COUNT(*) FILTER (WHERE l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx} AND l.status = 'Closed Won'))::int AS won_leads_curr,
      (COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.created_at >= $${currStartIdx} AND l.created_at <= $${currEndIdx} AND l.status = 'Closed Won'), 0))::numeric AS revenue_curr,
      
      (COUNT(*) FILTER (WHERE l.created_at >= $${prevStartIdx} AND l.created_at < $${currStartIdx}))::int AS total_leads_prev,
      (COUNT(*) FILTER (WHERE l.created_at >= $${prevStartIdx} AND l.created_at < $${currStartIdx} AND l.status = 'Qualified'))::int AS qualified_leads_prev,
      (COUNT(*) FILTER (WHERE l.created_at >= $${prevStartIdx} AND l.created_at < $${currStartIdx} AND l.status = 'Closed Won'))::int AS won_leads_prev,
      (COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.created_at >= $${prevStartIdx} AND l.created_at < $${currStartIdx} AND l.status = 'Closed Won'), 0))::numeric AS revenue_prev
    FROM leads l
    WHERE ${conditions.join(' AND ')} ${scopeStr}
  `;
  
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

const getTaskStats = async (tenantId, teamId, client = db) => {
  const params = [tenantId, teamId];
  let queryText = `
    SELECT
      (COUNT(*) FILTER (WHERE t.status = 'Done'))::int AS completed,
      (COUNT(*) FILTER (WHERE t.status != 'Done'))::int AS pending
    FROM tasks t
    JOIN developers d ON t.assigned_to_id = d.id
    JOIN teams tm ON d.team_id = tm.id
    WHERE t.tenant_id = $1 AND t.deleted_at IS NULL AND d.team_id = $2
  `;
  queryText += scopeHelper.getScopeCondition(params, 'tm', { branchColumn: 'branch_id', teamColumn: 'id' });
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

const getDeveloperTaskStats = async (tenantId, developerId, client = db) => {
  const params = [tenantId, developerId];
  let queryText = `
    SELECT
      (COUNT(*) FILTER (WHERE t.status = 'Done'))::int AS completed,
      (COUNT(*) FILTER (WHERE t.status != 'Done'))::int AS pending
    FROM tasks t
    JOIN developers d ON t.assigned_to_id = d.id
    JOIN teams tm ON d.team_id = tm.id
    WHERE t.tenant_id = $1 AND t.deleted_at IS NULL AND t.assigned_to_id = $2
  `;
  queryText += scopeHelper.getScopeCondition(params, 'tm', { branchColumn: 'branch_id', teamColumn: 'id' });
  const { rows } = await client.query(queryText, params);
  return rows[0];
};

const getBranchTargetStats = async (tenantId, branchId, client = db) => {
  const params = [branchId, tenantId];
  let queryText = `
    SELECT assigned_target, achieved_target FROM branches 
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, '', { branchColumn: 'id' });
  const { rows } = await client.query(queryText, params);
  if (rows.length === 0) return { assigned_target: 0, achieved_target: 0 };
  return {
    assigned_target: Number(rows[0].assigned_target) || 0,
    achieved_target: Number(rows[0].achieved_target) || 0
  };
};

const getBranchTLPerformance = async (tenantId, branchId, client = db) => {
  const params = [tenantId, branchId];
  let queryText = `
    SELECT COALESCE(AVG(tl.performance_score), 0)::numeric AS avg_performance
    FROM team_leaders tl
    JOIN teams t ON tl.team_id = t.id
    WHERE tl.tenant_id = $1 AND t.branch_id = $2 AND t.deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  const { rows } = await client.query(queryText, params);
  return rows[0] ? Number(rows[0].avg_performance) : 0;
};

const getLeadFunnel = async (tenantId, filters, client = db) => {
  const params = [tenantId];
  const conditions = [
    'l.tenant_id = $1', 
    'l.deleted_at IS NULL',
    'EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = l.branch_id AND b2.deleted_at IS NULL)'
  ];
  
  applyFilters(params, conditions, filters, 'l');
  
  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`l.created_at >= $${params.length}`);
  }
  
  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`l.created_at <= $${params.length}`);
  }
  
  const scopeStr = scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  
  const queryText = `
    SELECT status AS name, (COUNT(*))::int AS value 
    FROM leads l
    WHERE ${conditions.join(' AND ')} ${scopeStr}
    GROUP BY status
    ORDER BY CASE status 
      WHEN 'New' THEN 1 
      WHEN 'Contacted' THEN 2 
      WHEN 'Qualified' THEN 3 
      WHEN 'Negotiation' THEN 4 
      WHEN 'Closed Won' THEN 5 
      WHEN 'Closed Lost' THEN 6 
      ELSE 7 END
  `;
  const { rows } = await client.query(queryText, params);
  return rows;
};

const getRevenueTrend = async (tenantId, months, filters, client = db) => {
  const params = [tenantId, months];
  const conditions = [
    'l.tenant_id = $1',
    'l.status = \'Closed Won\'',
    'l.deleted_at IS NULL',
    'EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = l.branch_id AND b2.deleted_at IS NULL)'
  ];
  
  applyFilters(params, conditions, filters, 'l');
  
  let joinConditions = 'AND ' + conditions.join(' AND ');
  const scopeStr = scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  joinConditions += scopeStr;
  
  const queryText = `
    SELECT 
      TO_CHAR(m.month, 'Mon') AS name,
      COALESCE(SUM(l.expected_revenue), 0)::numeric AS value
    FROM (
      SELECT DATE_TRUNC('month', CURRENT_DATE - (i || ' month')::interval) AS month
      FROM generate_series(0, $2::int - 1) i
    ) m
    LEFT JOIN leads l ON DATE_TRUNC('month', l.created_at) = m.month 
      AND l.tenant_id = $1 ${joinConditions}
    GROUP BY m.month
    ORDER BY m.month ASC
  `;
  const { rows } = await client.query(queryText, params);
  return rows;
};

const getBranchPerformance = async (tenantId, filters, client = db) => {
  const { startDate, endDate } = filters;
  const params = [tenantId];
  let joinConditions = 'AND l.deleted_at IS NULL';
  
  if (startDate) {
    params.push(startDate);
    joinConditions += ` AND l.created_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    joinConditions += ` AND l.created_at <= $${params.length}`;
  }
  const scopeStr = scopeHelper.getScopeCondition(params, 'b', { branchColumn: 'id' });
  
  const queryText = `
    SELECT 
      b.id AS "branchId",
      b.branch_name AS "branchName",
      u.first_name || ' ' || u.last_name AS "managerName",
      (b.deleted_at IS NULL) AS "isActive",
      (COUNT(l.id))::int AS "totalLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'New'))::int AS "newLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'Qualified'))::int AS "qualifiedLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'Negotiation'))::int AS "negotiationLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'Closed Won'))::int AS "wonLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'Closed Lost'))::int AS "lostLeads",
      (COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.status = 'Closed Won'), 0))::numeric AS revenue,
      (COALESCE(ROUND(
        (COUNT(l.id) FILTER (WHERE l.status = 'Closed Won')::numeric / NULLIF(COUNT(l.id), 0)) * 100,
        2
      ), 0))::numeric AS conversion,
      (SELECT COUNT(tl.id) FROM team_leaders tl JOIN teams t ON tl.team_id = t.id WHERE t.branch_id = b.id AND t.deleted_at IS NULL)::int AS "teamLeaders",
      (SELECT COUNT(d.id) FROM developers d JOIN teams t ON d.team_id = t.id WHERE t.branch_id = b.id AND t.deleted_at IS NULL)::int AS "developers"
    FROM branches b
    LEFT JOIN users u ON b.manager_id = u.id
    LEFT JOIN leads l ON b.id = l.branch_id AND l.deleted_at IS NULL
    WHERE b.tenant_id = $1 AND b.deleted_at IS NULL ${joinConditions} ${scopeStr}
    GROUP BY b.id, u.id
    ORDER BY revenue DESC
  `;
  const { rows } = await client.query(queryText, params);
  
  // Format for frontend
  return rows.map(row => ({
    name: row.branchName,
    managerName: row.managerName,
    totalLeads: row.totalLeads,
    newLeads: row.newLeads,
    qualifiedLeads: row.qualifiedLeads,
    negotiationLeads: row.negotiationLeads,
    wonLeads: row.wonLeads,
    lostLeads: row.lostLeads,
    revenue: row.revenue,
    conversion: row.conversion,
    teamLeaders: row.teamLeaders,
    developers: row.developers,
    status: row.isActive ? 'Active' : 'Inactive'
  }));
};

const getTeamPerformance = async (tenantId, filters, client = db) => {
  const { branchId, startDate, endDate } = filters;
  const params = [tenantId];
  let joinConditions = '';
  let tConditions = 'WHERE t.tenant_id = $1 AND t.deleted_at IS NULL';
  
  if (branchId) {
    params.push(branchId);
    tConditions += ` AND t.branch_id = $${params.length}`;
  }
  if (startDate) {
    params.push(startDate);
    joinConditions += ` AND l.created_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    joinConditions += ` AND l.created_at <= $${params.length}`;
  }
  const scopeStr = scopeHelper.getScopeCondition(params, 't', { branchColumn: 'branch_id', teamColumn: 'id' });
  
  const queryText = `
    SELECT 
      t.id AS "teamId",
      t.team_name AS "teamName",
      u.first_name || ' ' || u.last_name AS "teamLeader",
      b.branch_name AS "branchName",
      (COUNT(l.id))::int AS "assignedLeads",
      (COUNT(l.id) FILTER (WHERE l.status IN ('Closed Won', 'Closed Lost')))::int AS "completedLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'Closed Won'))::int AS "wonLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'Closed Lost'))::int AS "lostLeads",
      (COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.status = 'Closed Won'), 0))::numeric AS "revenueGenerated",
      (COALESCE(ROUND(
        (COUNT(l.id) FILTER (WHERE l.status = 'Closed Won')::numeric / NULLIF(COUNT(l.id), 0)) * 100, 
        2
      ), 0))::numeric AS conversion
    FROM teams t
    LEFT JOIN branches b ON t.branch_id = b.id
    LEFT JOIN team_leaders tl ON tl.team_id = t.id
    LEFT JOIN users u ON tl.user_id = u.id
    LEFT JOIN leads l ON l.team_id = t.id AND l.deleted_at IS NULL
    WHERE t.tenant_id = $1 AND t.deleted_at IS NULL ${joinConditions} ${scopeStr}
    GROUP BY t.id, t.team_name, b.branch_name, u.id
    ORDER BY "revenueGenerated" DESC
  `;
  const { rows } = await client.query(queryText, params);
  return rows;
};

const getDeveloperPerformance = async (tenantId, filters, client = db) => {
  const { branchId, startDate, endDate } = filters;
  const params = [tenantId];
  let joinConditions = '';
  let dConditions = 'WHERE d.tenant_id = $1';
  
  if (branchId) {
    params.push(branchId);
    dConditions += ` AND tm.branch_id = $${params.length}`;
  }
  if (startDate) {
    params.push(startDate);
    joinConditions += ` AND t.created_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    joinConditions += ` AND t.created_at <= $${params.length}`;
  }
  
  const scopeStr = scopeHelper.getScopeCondition(params, 'tm', { branchColumn: 'branch_id', teamColumn: 'id' });
  
  const queryText = `
    SELECT 
      d.id AS "developerId",
      u.first_name || ' ' || u.last_name AS "developerName",
      b.branch_name AS "branchName",
      (COUNT(t.id))::int AS "assignedTasks",
      (COUNT(t.id) FILTER (WHERE t.status = 'Done'))::int AS "completedTasks",
      (COUNT(t.id) FILTER (WHERE t.status != 'Done'))::int AS "pendingTasks",
      (COALESCE(SUM(t.hours_worked), 0))::numeric AS "hoursWorked",
      'N/A' AS "currentSprint"
    FROM developers d
    LEFT JOIN users u ON d.user_id = u.id
    LEFT JOIN teams tm ON d.team_id = tm.id
    LEFT JOIN branches b ON tm.branch_id = b.id
    LEFT JOIN tasks t ON t.assigned_to_id = d.id AND t.deleted_at IS NULL
    WHERE d.tenant_id = $1 ${joinConditions} ${scopeStr}
    GROUP BY d.id, u.id, b.branch_name
    ORDER BY "completedTasks" DESC
  `;
  const { rows } = await client.query(queryText, params);
  return rows;
};

const getDetailedLeadsReport = async (tenantId, filters, client = db) => {
  const params = [tenantId];
  let conditions = ['l.tenant_id = $1', 'l.deleted_at IS NULL'];
  
  applyFilters(params, conditions, filters, 'l');
  
  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`l.created_at >= $${params.length}`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`l.created_at <= $${params.length}`);
  }
  if (filters.leadSource) {
    params.push(filters.leadSource);
    conditions.push(`l.lead_source = $${params.length}`);
  }
  
  const scopeStr = scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  
  const queryText = `
    SELECT 
      l.id AS "leadId",
      l.name AS "leadName",
      l.company_name AS "companyName",
      l.contact_person AS "clientName",
      b.branch_name AS "branchName",
      bm.first_name || ' ' || bm.last_name AS "branchManager",
      tl_u.first_name || ' ' || tl_u.last_name AS "teamLeader",
      d_u.first_name || ' ' || d_u.last_name AS "assignedDeveloper",
      l.status AS "leadStatus",
      l.status AS "currentPhase",
      l.priority AS "priority",
      l.lead_source AS "leadSource",
      l.budget AS "estimatedBudget",
      l.expected_revenue AS "expectedRevenue",
      CASE WHEN l.status = 'Closed Won' THEN l.expected_revenue ELSE 0 END AS "finalRevenue",
      CASE WHEN l.status NOT IN ('Closed Won', 'Closed Lost') THEN l.expected_revenue ELSE 0 END AS "pipelineValue",
      l.created_at AS "createdDate",
      l.expected_start_date AS "expectedClosingDate",
      CASE WHEN l.status = 'Closed Won' THEN l.updated_at ELSE NULL END AS "wonDate",
      CASE WHEN l.status = 'Closed Lost' THEN l.updated_at ELSE NULL END AS "lostDate",
      l.city AS "city",
      l.country AS "state",
      l.updated_at AS "lastUpdated"
    FROM leads l
    LEFT JOIN branches b ON l.branch_id = b.id
    LEFT JOIN users bm ON b.manager_id = bm.id
    LEFT JOIN teams t ON l.team_id = t.id
    LEFT JOIN team_leaders tl ON tl.team_id = t.id
    LEFT JOIN users tl_u ON tl.user_id = tl_u.id
    LEFT JOIN developers d ON l.assigned_sales_user_id = d.id
    LEFT JOIN users d_u ON d.user_id = d_u.id
    WHERE ${conditions.join(' AND ')} ${scopeStr}
    ORDER BY l.created_at DESC
  `;
  const { rows } = await client.query(queryText, params);
  return rows;
};

const getMonthlyReport = async (tenantId, filters, client = db) => {
  const months = filters.months || 12;
  const params = [tenantId, months];
  let conditions = ['l.tenant_id = $1', 'l.deleted_at IS NULL'];
  
  applyFilters(params, conditions, filters, 'l');
  
  let joinConditions = 'AND ' + conditions.slice(1).join(' AND ');
  const scopeStr = scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  joinConditions += scopeStr;
  
  const queryText = `
    SELECT 
      TO_CHAR(m.month, 'Mon YYYY') AS "month",
      (COUNT(l.id))::int AS "totalLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'Closed Won'))::int AS "wonLeads",
      (COUNT(l.id) FILTER (WHERE l.status = 'Closed Lost'))::int AS "lostLeads",
      (COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.status = 'Closed Won'), 0))::numeric AS "revenue",
      (COALESCE(ROUND(
        (COUNT(l.id) FILTER (WHERE l.status = 'Closed Won')::numeric / NULLIF(COUNT(l.id), 0)) * 100, 
        2
      ), 0))::numeric AS "conversionRate",
      m.month AS "sortDate"
    FROM (
      SELECT DATE_TRUNC('month', CURRENT_DATE - (i || ' month')::interval) AS month
      FROM generate_series(0, $2::int - 1) i
    ) m
    LEFT JOIN leads l ON DATE_TRUNC('month', l.created_at) = m.month 
      AND l.tenant_id = $1 ${joinConditions}
    GROUP BY m.month
    ORDER BY m.month DESC
  `;
  const { rows } = await client.query(queryText, params);
  return rows;
};

const getRecentActivities = async (tenantId, limit, filters, client = db) => {
  const { branchId, teamId, developerId } = filters;
  const params = [tenantId, limit];
  const conditions = [
    'la.tenant_id = $1', 
    'l.deleted_at IS NULL',
    'EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = l.branch_id AND b2.deleted_at IS NULL)'
  ];
  
  if (branchId) {
    params.push(branchId);
    conditions.push(`l.branch_id = $${params.length}`);
  }
  if (teamId) {
    params.push(teamId);
    conditions.push(`l.team_id = $${params.length}`);
  }
  if (developerId) {
    params.push(developerId);
    conditions.push(`l.assigned_sales_user_id = $${params.length}`);
  }
  const scopeStr = scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  
  const queryText = `
    SELECT 
      la.id AS id,
      l.name AS "leadName",
      la.activity_type AS action,
      la.created_at AS time
    FROM lead_activities la
    JOIN leads l ON la.lead_id = l.id
    WHERE ${conditions.join(' AND ')} ${scopeStr}
    ORDER BY la.created_at DESC
    LIMIT $2
  `;
  const { rows } = await client.query(queryText, params);
  return rows;
};

const getUpcomingFollowups = async (tenantId, limit, filters, client = db) => {
  const { branchId, teamId, developerId } = filters;
  const params = [tenantId, limit];
  const conditions = [
    'lf.tenant_id = $1',
    'lf.status = \'Pending\'',
    'lf.followup_date > NOW()',
    'l.deleted_at IS NULL',
    'EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = l.branch_id AND b2.deleted_at IS NULL)'
  ];
  
  if (branchId) {
    params.push(branchId);
    conditions.push(`l.branch_id = $${params.length}`);
  }
  if (teamId) {
    params.push(teamId);
    conditions.push(`l.team_id = $${params.length}`);
  }
  if (developerId) {
    params.push(developerId);
    conditions.push(`l.assigned_sales_user_id = $${params.length}`);
  }
  const scopeStr = scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  
  const queryText = `
    SELECT 
      lf.id AS id,
      l.name AS "leadName",
      lf.followup_date AS date,
      lf.communication_type AS type,
      u.first_name || ' ' || u.last_name AS "assignedTo"
    FROM lead_followups lf
    JOIN leads l ON lf.lead_id = l.id
    LEFT JOIN users u ON lf.created_by = u.id
    WHERE ${conditions.join(' AND ')} ${scopeStr}
    ORDER BY lf.followup_date ASC
    LIMIT $2
  `;
  const { rows } = await client.query(queryText, params);
  return rows;
};

const getQuarterlyPerformance = async (tenantId, filters, client = db) => {
  const { branchId, teamId, developerId, fyOffset = 0 } = filters;
  const params = [tenantId];
  let joinConditions = 'AND l.tenant_id = $1 AND l.deleted_at IS NULL AND EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = l.branch_id AND b2.deleted_at IS NULL)';

  if (branchId) {
    params.push(branchId);
    joinConditions += ` AND l.branch_id = $${params.length}`;
  }
  if (teamId) {
    params.push(teamId);
    joinConditions += ` AND l.team_id = $${params.length}`;
  }
  if (developerId) {
    params.push(developerId);
    joinConditions += ` AND l.assigned_sales_user_id = $${params.length}`;
  }
  const scopeStr = scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  joinConditions += scopeStr;
  
  params.push(parseInt(fyOffset) || 0);
  const offsetIdx = params.length;

  const queryText = `
    WITH fy_dates AS (
      SELECT 
        (CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 4 
          THEN DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '3 months'
          ELSE DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '9 months'
        END) + (INTERVAL '1 year' * $${offsetIdx}) AS fy_start
    ),
    branch_target AS (
      SELECT COALESCE(SUM(assigned_target), 0) / 4 as quarter_target
      FROM branches
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ${branchId ? `AND id = $2` : ''}
    ),
    quarterly_data AS (
      SELECT 
        CASE 
          WHEN EXTRACT(month FROM l.created_at) IN (4, 5, 6) THEN 'Q1'
          WHEN EXTRACT(month FROM l.created_at) IN (7, 8, 9) THEN 'Q2'
          WHEN EXTRACT(month FROM l.created_at) IN (10, 11, 12) THEN 'Q3'
          ELSE 'Q4'
        END AS quarter,
        MIN(l.created_at) as q_start,
        COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.status = 'Closed Won'), 0)::numeric AS achieved,
        COALESCE(SUM(l.expected_revenue) FILTER (WHERE l.status NOT IN ('Closed Won', 'Closed Lost')), 0)::numeric AS pending,
        COUNT(l.id) FILTER (WHERE l.status = 'Closed Won')::int AS won_leads,
        COUNT(l.id) FILTER (WHERE l.status = 'Closed Lost')::int AS lost_leads,
        COUNT(l.id) FILTER (WHERE l.status = 'Qualified')::int AS qualified_leads
      FROM leads l
      CROSS JOIN fy_dates
      WHERE 1=1 ${joinConditions}
        AND l.created_at >= (fy_dates.fy_start - INTERVAL '3 months') 
        AND l.created_at < (fy_dates.fy_start + INTERVAL '1 year')
      GROUP BY 1
    ),
    ordered_quarters AS (
      SELECT 
        qd.quarter,
        qd.q_start,
        qd.achieved,
        qd.pending,
        qd.won_leads,
        qd.lost_leads,
        qd.qualified_leads,
        (SELECT quarter_target FROM branch_target) AS target,
        LAG(qd.achieved) OVER (ORDER BY qd.q_start) AS prev_achieved
      FROM quarterly_data qd
    )
    SELECT 
      oq.quarter,
      oq.target,
      oq.achieved,
      oq.pending,
      oq.won_leads AS "wonLeads",
      oq.lost_leads AS "lostLeads",
      oq.qualified_leads AS "qualifiedLeads",
      oq.achieved AS "totalRevenue",
      GREATEST(oq.target - oq.achieved, 0) AS remaining,
      CASE 
        WHEN oq.target > 0 THEN ROUND((oq.achieved / oq.target) * 100, 1)
        WHEN oq.achieved > 0 THEN 100.0
        ELSE 0.0
      END AS "achievementPercentage",
      CASE 
        WHEN oq.prev_achieved > 0 THEN ROUND(((oq.achieved - oq.prev_achieved) / oq.prev_achieved) * 100, 1)
        WHEN oq.achieved > 0 THEN 100.0
        ELSE NULL
      END AS "growthPercentage",
      (SELECT fy_start FROM fy_dates) AS fy_start
    FROM ordered_quarters oq
    CROSS JOIN fy_dates
    WHERE oq.q_start >= fy_dates.fy_start
    ORDER BY oq.q_start;
  `;

  const { rows } = await client.query(queryText, params);
  
  // Format the output
  const today = new Date();
  let baseYear = today.getFullYear();
  if (today.getMonth() < 3) baseYear -= 1;
  baseYear += (parseInt(fyOffset) || 0);
  const financialYear = `FY ${baseYear}-${(baseYear + 1).toString().slice(-2)}`;

  const getStatus = (pct) => {
    if (pct >= 100) return 'Exceeded Target';
    if (pct >= 80) return 'On Track';
    if (pct >= 50) return 'Needs Attention';
    return 'Below Target';
  };

  return rows.map(r => {
    const achievementPercentage = Number(r.achievementPercentage);
    return {
      quarter: r.quarter,
      financialYear: financialYear,
      target: Number(r.target),
      achieved: Number(r.achieved),
      remaining: Number(r.remaining),
      pending: Number(r.pending),
      achievementPercentage,
      growthPercentage: r.growthPercentage !== null ? Number(r.growthPercentage) : null,
      status: getStatus(achievementPercentage),
      wonLeads: Number(r.wonLeads),
      lostLeads: Number(r.lostLeads),
      qualifiedLeads: Number(r.qualifiedLeads),
      totalRevenue: Number(r.totalRevenue)
    };
  });
};

module.exports = {
  findTeamLeaderTeamId,
  findDeveloperId,
  getSummary,
  getTaskStats,
  getDeveloperTaskStats,
  getBranchTargetStats,
  getBranchTLPerformance,
  getLeadFunnel,
  getRevenueTrend,
  getBranchPerformance,
  getTeamPerformance,
  getDeveloperPerformance,
  getDetailedLeadsReport,
  getMonthlyReport,
  getRecentActivities,
  getUpcomingFollowups,
  getQuarterlyPerformance
};
