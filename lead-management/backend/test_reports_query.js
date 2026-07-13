require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lead_management',
});

async function run() {
  await client.connect();
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
    ),
    branch_followups AS (
      SELECT
        l.branch_id,
        COUNT(f.id) FILTER (WHERE f.status = 'Pending' AND f.followup_date >= NOW()) AS upcoming_followups,
        COUNT(f.id) FILTER (WHERE f.status = 'Pending' AND f.followup_date < NOW()) AS overdue_followups
      FROM lead_followups f
      JOIN leads l ON f.lead_id = l.id
      WHERE f.tenant_id = $1 AND l.deleted_at IS NULL
      GROUP BY l.branch_id
    ),
    branch_activities AS (
      SELECT
        l.branch_id,
        COUNT(a.id) AS recent_activities
      FROM lead_activities a
      JOIN leads l ON a.lead_id = l.id
      WHERE a.tenant_id = $1 AND a.created_at >= NOW() - INTERVAL '30 days' AND l.deleted_at IS NULL
      GROUP BY l.branch_id
    )
    SELECT 
      b.id,
      b.branch_name AS branch_name,
      b.branch_code AS branch_code,
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
      COALESCE(bt.developers_count, 0)::int AS developers_count,
      COALESCE(bf.upcoming_followups, 0)::int AS upcoming_followups,
      COALESCE(bf.overdue_followups, 0)::int AS overdue_followups,
      COALESCE(ba.recent_activities, 0)::int AS recent_activities
    FROM branches b
    LEFT JOIN users u ON b.manager_id = u.id
    LEFT JOIN branch_leads bl ON bl.branch_id = b.id
    LEFT JOIN branch_teams bt ON bt.branch_id = b.id
    LEFT JOIN branch_followups bf ON bf.branch_id = b.id
    LEFT JOIN branch_activities ba ON ba.branch_id = b.id
    WHERE b.tenant_id = $1 AND b.deleted_at IS NULL
    ORDER BY b.branch_name ASC;
  `;
  try {
    const res = await client.query(queryText, ['708170c2-ce62-42da-aaec-a6cb9e943486']); 
    console.log("Query success:", res.rowCount);
  } catch(e) {
    console.log("Query error:", e.message);
  }
  await client.end();
}

run().catch(console.error);
