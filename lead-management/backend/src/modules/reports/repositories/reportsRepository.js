const db = require('../../../database');

const getBranchSnapshot = async (tenantId, client = db) => {
  const queryText = `
    WITH branch_leads AS (
      SELECT 
        branch_id,
        COUNT(id) AS total_leads,
        COUNT(id) FILTER (WHERE status = 'Qualified') AS qualified_leads,
        COUNT(id) FILTER (WHERE status = 'Contacted') AS contacted_leads,
        COUNT(id) FILTER (WHERE status = 'Negotiation') AS negotiation_leads,
        COUNT(id) FILTER (WHERE status = 'Closed Won') AS won_leads,
        COUNT(id) FILTER (WHERE status = 'Closed Lost') AS lost_leads,
        COALESCE(SUM(expected_revenue), 0) AS expected_revenue,
        COALESCE(SUM(expected_revenue) FILTER (WHERE status = 'Closed Won'), 0) AS won_revenue
      FROM leads
      WHERE tenant_id = $1 AND deleted_at IS NULL
      GROUP BY branch_id
    ),
    branch_teams AS (
      SELECT
        t.branch_id,
        COUNT(DISTINCT t.id) AS teams_count,
        COUNT(DISTINCT tl.id) AS team_leaders_count,
        COUNT(DISTINCT d.id) AS developers_count
      FROM teams t
      LEFT JOIN team_leaders tl ON tl.team_id = t.id
      LEFT JOIN developers d ON d.team_id = t.id
      WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
      GROUP BY t.branch_id
    )
    SELECT 
      b.id,
      b.branch_name,
      b.branch_code,
      b.city,
      b.state,
      b.status,
      u.first_name || ' ' || u.last_name AS manager_name,
      COALESCE(bl.total_leads, 0)::int AS total_leads,
      COALESCE(bl.qualified_leads, 0)::int AS qualified_leads,
      COALESCE(bl.contacted_leads, 0)::int AS contacted_leads,
      COALESCE(bl.negotiation_leads, 0)::int AS negotiation_leads,
      COALESCE(bl.won_leads, 0)::int AS won_leads,
      COALESCE(bl.lost_leads, 0)::int AS lost_leads,
      COALESCE(bl.expected_revenue, 0)::numeric AS expected_revenue,
      COALESCE(bl.won_revenue, 0)::numeric AS won_revenue,
      COALESCE(bt.teams_count, 0)::int AS teams_count,
      COALESCE(bt.team_leaders_count, 0)::int AS team_leaders_count,
      COALESCE(bt.developers_count, 0)::int AS developers_count
    FROM branches b
    LEFT JOIN users u ON b.manager_id = u.id
    LEFT JOIN branch_leads bl ON bl.branch_id = b.id
    LEFT JOIN branch_teams bt ON bt.branch_id = b.id
    WHERE b.tenant_id = $1 AND b.deleted_at IS NULL
    ORDER BY b.branch_name ASC;
  `;
  try {
    console.log('Executing getBranchSnapshot query for tenantId:', tenantId);
    const { rows } = await client.query(queryText, [tenantId]);
    console.log('getBranchSnapshot query success, rows:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error in getBranchSnapshot query:', error.message);
    throw error;
  }
};

module.exports = {
  getBranchSnapshot,
};
