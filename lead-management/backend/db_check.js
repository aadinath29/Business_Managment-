const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'Admin@123',
  database: 'Business',
});

async function runQueries() {
  try {
    const res1 = await pool.query(`
    SELECT t.id as team_id, t.team_name, t.department, t.branch_id, b.branch_name, tl.id as team_leader_id, tl.performance_score, tl.employee_id, tl.designation, u.first_name || ' ' || u.last_name as team_leader_name, u.email, u.phone, u.status, u.id as user_id,
           (SELECT COUNT(*) FROM developers d WHERE d.team_id = t.id) as member_count,
           (SELECT COALESCE(json_agg(json_build_object('id', d.id, 'name', du.first_name || ' ' || du.last_name, 'employee_id', d.employee_id)), '[]'::json) FROM developers d JOIN users du ON d.user_id = du.id WHERE d.team_id = t.id) as members
    FROM teams t
    JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
    JOIN team_leaders tl ON t.id = tl.team_id
    JOIN users u ON tl.user_id = u.id AND u.deleted_at IS NULL
    LIMIT 2;
    `);
    console.log("Teams Query Result:", res1.rows);

    const res2 = await pool.query(`
    SELECT t.id as team_id, t.team_name, t.department, t.branch_id, b.branch_name, tl.id as team_leader_id, tl.performance_score, tl.employee_id, tl.designation, u.first_name || ' ' || u.last_name as team_leader_name, u.email, u.phone, u.status, u.id as user_id,
           (SELECT COUNT(*) FROM developers d WHERE d.team_id = tl.team_id) as member_count,
           (SELECT COALESCE(json_agg(json_build_object('id', d.id, 'name', du.first_name || ' ' || du.last_name, 'employee_id', d.employee_id)), '[]'::json) FROM developers d JOIN users du ON d.user_id = du.id WHERE d.team_id = tl.team_id) as members
    FROM team_leaders tl
    JOIN users u ON tl.user_id = u.id AND u.deleted_at IS NULL
    JOIN teams t ON tl.team_id = t.id AND t.deleted_at IS NULL
    JOIN branches b ON t.branch_id = b.id AND b.deleted_at IS NULL
    LIMIT 2;
    `);
    console.log("Team Leaders Query Result:", res2.rows);

  } catch (error) {
    console.error(error);
  } finally {
    pool.end();
  }
}

runQueries();
