require('dotenv').config();
const { pool } = require('./src/database');

async function testQuery() {
  try {
    const tenantId = 'aaaa0000-0000-0000-0000-000000000000';
    const params = [tenantId];
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM teams t
      JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
      WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
    `;
    const countRes = await pool.query(countQuery, params);
    console.log("CountQuery OK:", countRes.rows[0].count);

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM teams t WHERE t.tenant_id = $1 AND t.deleted_at IS NULL ) as total_teams,
        (SELECT COUNT(*) FROM team_leaders tl JOIN teams t ON tl.team_id = t.id JOIN users u ON tl.user_id = u.id WHERE tl.tenant_id = $1 AND u.deleted_at IS NULL ) as total_team_leaders,
        (SELECT COUNT(*) FROM developers d JOIN teams t ON d.team_id = t.id JOIN users u ON d.user_id = u.id WHERE d.tenant_id = $1 AND u.deleted_at IS NULL ) as total_developers,
        (SELECT COALESCE(AVG(performance_score), 0) FROM team_leaders tl JOIN teams t ON tl.team_id = t.id JOIN users u ON tl.user_id = u.id WHERE tl.tenant_id = $1 AND u.deleted_at IS NULL ) as average_performance
    `;
    const statsRes = await pool.query(statsQuery, params);
    console.log("StatsQuery OK:", statsRes.rows[0]);

  } catch (error) {
    console.error("SQL ERROR:", error);
  } finally {
    pool.end();
  }
}

testQuery();
