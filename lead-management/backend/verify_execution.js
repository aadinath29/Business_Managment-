const { Client } = require('pg');
const path = require('path');
const backendDir = 'c:/Users/DELL/Desktop/buisness management/lead-management/backend';
require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') });

const API_URL = 'http://localhost:5000/api/v1';

// Helper to construct DB client
const getDbClient = () => {
  return new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

// Login helper to get Access Token
async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data.accessToken;
}

// Clean up DB helper
async function cleanupDb(client, tenantId, branchId, teamId, leadIds = []) {
  if (leadIds.length) {
    await client.query('DELETE FROM lead_activities WHERE lead_id = ANY($1)', [leadIds]);
    await client.query('DELETE FROM projects WHERE lead_id = ANY($1)', [leadIds]);
    await client.query('DELETE FROM proposals WHERE lead_id = ANY($1)', [leadIds]);
    await client.query('DELETE FROM lead_assignments WHERE lead_id = ANY($1)', [leadIds]);
    await client.query('DELETE FROM leads WHERE id = ANY($1)', [leadIds]);
  }
  if (teamId) {
    await client.query('DELETE FROM teams WHERE id = $1', [teamId]);
  }
  if (branchId) {
    await client.query('DELETE FROM branches WHERE id = $1', [branchId]);
  }
  if (tenantId) {
    await client.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
  }
}

async function runTests() {
  console.log('=== STARTING LEAD ASSIGNMENT & PROJECT EXECUTION INTEGRATION TESTS (PHASE 7E) ===');
  
  // 1. Authenticate users
  console.log('\n[1] Authenticating test accounts...');
  const superAdminToken = await login('admin@antigravity.com', 'Admin@123');
  const teamLeaderToken = await login('rohan.verma@kosqu.com', 'TL@12345');
  const developerToken = await login('aarav.mehta@kosqu.com', 'Dev@12345');
  
  console.log('✔ Super Admin authenticated');
  console.log('✔ Team Leader authenticated');
  console.log('✔ Developer authenticated');

  const dbClient = getDbClient();
  await dbClient.connect();

  const createdLeadIds = [];
  let crossTenantId = null;
  let crossBranchId = null;
  let crossUserId = null;
  let crossAdminToken = null;

  try {
    const validBranchId = 'cccc0000-0000-0000-0000-000000000001'; // Kosque Advertisement (Mumbai)
    const validTeamId = 'dddd0000-0000-0000-0000-000000000001';   // Mumbai Avengers
    const teamLeaderUserId = 'bbbb0000-0000-0000-0000-000000000003'; // Rohan Verma
    const developerUserId = 'bbbb0000-0000-0000-0000-000000000004';  // Aarav Mehta

    // Setup cross tenant admin
    console.log('\n[2] Setting up cross-tenant test data...');
    crossTenantId = 'aaaa9999-9999-9999-9999-999999999999';
    await dbClient.query(`INSERT INTO tenants (id, name, status) VALUES ($1, 'Proj Cross Tenant', 'Active') ON CONFLICT DO NOTHING`, [crossTenantId]);
    
    const passHash = '$2b$10$uoNhEr5tKgfCj3S/pzIzX.YmDi6aL2t/GDhkdxq/vUS4.5d6xvhhW';
    crossUserId = 'bbbb9999-9999-9999-9999-999999999999';
    await dbClient.query(`
      INSERT INTO users (id, tenant_id, role_id, email, password_hash, first_name, last_name, status)
      VALUES ($1, $2, '22222222-2222-2222-2222-222222222222', 'admin@projcross.com', $3, 'Proj', 'Admin', 'Active')
      ON CONFLICT DO NOTHING
    `, [crossUserId, crossTenantId, passHash]);

    crossBranchId = 'cccc9999-9999-9999-9999-999999999999';
    await dbClient.query(`
      INSERT INTO branches (id, tenant_id, branch_name, branch_code, city, company_name)
      VALUES ($1, $2, 'Proj Cross Branch', 'PCB99', 'Pune', 'Proj Cross Comp')
      ON CONFLICT DO NOTHING
    `, [crossBranchId, crossTenantId]);

    crossAdminToken = await login('admin@projcross.com', 'Admin@123');
    console.log('✔ Cross-tenant Admin authenticated');

    // Create Lead (POST /api/v1/leads)
    console.log('\n[3] Creating test lead...');
    const payload = {
      name: 'Project Execution Test Lead',
      branch_id: validBranchId,
      team_id: validTeamId,
      status: 'New',
      priority: 'High'
    };

    let res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify(payload)
    });
    
    if (res.status !== 201) throw new Error('Lead creation failed');
    const lead = (await res.json()).data;
    createdLeadIds.push(lead.id);
    console.log(`✔ Lead created: ID=${lead.id}`);

    // ==========================================
    // A. TEST LEAD ASSIGNMENT
    // ==========================================
    console.log('\n[4] Testing Lead Assignment endpoints...');
    
    // 1. Assign Lead to Developer
    res = await fetch(`${API_URL}/leads/${lead.id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        assigned_team_id: validTeamId,
        assigned_to_user_id: developerUserId,
        reason: 'Assigning to our primary developer for Discovery stage',
        assignment_type: 'Developer'
      })
    });
    if (res.status !== 201) {
      const err = await res.json();
      console.error(err);
      throw new Error(`Assign lead failed: ${res.status}`);
    }
    const assignRec = (await res.json()).data;
    console.log(`✔ Lead assigned: ID=${assignRec.id}`);

    // Verify activity logged
    let actRes = await dbClient.query('SELECT * FROM lead_activities WHERE lead_id = $1 AND activity_type = $2', [lead.id, 'Lead Assigned']);
    if (actRes.rows.length === 0) throw new Error('No activity for Lead Assigned found');
    console.log('✔ "Lead Assigned" activity log verified');

    // 2. Get Current Assignment
    res = await fetch(`${API_URL}/leads/${lead.id}/assignment`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200) throw new Error('Get assignment failed');
    const currentAssign = (await res.json()).data;
    if (currentAssign.assigned_to_user_id !== developerUserId) throw new Error('Assignee mismatch');
    console.log('✔ Current Lead Assignment retrieved successfully');

    // 3. Reassign Lead to Team Leader
    res = await fetch(`${API_URL}/leads/${lead.id}/reassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        assigned_team_id: validTeamId,
        assigned_to_user_id: teamLeaderUserId,
        reason: 'Reassigning to team leader for management review',
        assignment_type: 'Team Leader'
      })
    });
    if (res.status !== 200) {
      const txt = await res.text();
      console.error('Reassign failed body:', txt);
      throw new Error('Reassign lead failed');
    }
    const reassignRec = (await res.json()).data;
    console.log(`✔ Lead reassigned: ID=${reassignRec.id}`);

    // Verify assignment history preserved
    res = await fetch(`${API_URL}/leads/${lead.id}/assignment-history`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const history = (await res.json()).data;
    if (history.length < 2) throw new Error('Expected multiple assignment history records');
    console.log('✔ Assignment history preservation verified');


    // ==========================================
    // B. TEST PROJECT CREATION
    // ==========================================
    console.log('\n[5] Testing Project Creation...');

    // Assign back to developer (so that developer is the assigned salesperson on the lead and will become project's developer_id)
    await fetch(`${API_URL}/leads/${lead.id}/reassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        assigned_team_id: validTeamId,
        assigned_to_user_id: developerUserId,
        reason: 'Back to dev for project start',
        assignment_type: 'Developer'
      })
    });

    // Try creating project before proposal approval (should fail)
    res = await fetch(`${API_URL}/leads/${lead.id}/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ project_name: 'Exec Proj' })
    });
    console.log(`✔ Create project before approval response: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Project must block creation without approved proposal');

    // Create and approve proposal
    const propRes = await fetch(`${API_URL}/leads/${lead.id}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        proposal_version: 'v1.0',
        quotation_amount: 20000,
        discount: 2000,
        status: 'Draft'
      })
    });
    const prop = (await propRes.json()).data;

    // Approve Proposal
    await fetch(`${API_URL}/proposals/${prop.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ remarks: 'Looks great' })
    });

    // Try creating project before contract signed (should fail)
    res = await fetch(`${API_URL}/leads/${lead.id}/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ project_name: 'Exec Proj' })
    });
    console.log(`✔ Create project before contract signed response: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Project must block creation without signed contract');

    // Sign contract
    await fetch(`${API_URL}/proposals/${prop.id}/sign-contract`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });

    // Create Project (should succeed)
    res = await fetch(`${API_URL}/leads/${lead.id}/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        project_name: 'CRM SaaS Application Build',
        technology: 'React Native & Express',
        start_date: '2026-07-02',
        deadline: '2026-10-02',
        total_cost: 18000
      })
    });
    if (res.status !== 201) {
      const err = await res.json();
      console.error(err);
      throw new Error(`Create project failed: ${res.status}`);
    }
    const project = (await res.json()).data;
    console.log(`✔ Project created successfully: ID=${project.id}, Name="${project.project_name}"`);

    // Verify activity logged
    actRes = await dbClient.query('SELECT * FROM lead_activities WHERE lead_id = $1 AND activity_type = $2', [lead.id, 'Project Created']);
    if (actRes.rows.length === 0) throw new Error('No activity for Project Created found');
    console.log('✔ "Project Created" activity log verified');

    // Duplicate project creation block (should fail)
    res = await fetch(`${API_URL}/leads/${lead.id}/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ project_name: 'Duplicate Project' })
    });
    console.log(`✔ Duplicate project creation response status: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Duplicate project creation must be blocked');


    // ==========================================
    // C. TEST PROJECT MANAGEMENT
    // ==========================================
    console.log('\n[6] Testing Project Management CRUD...');

    // 1. Get Project By ID
    res = await fetch(`${API_URL}/projects/${project.id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200) throw new Error('Get project by ID failed');
    const projById = (await res.json()).data;
    if (projById.project_name !== 'CRM SaaS Application Build') throw new Error('Project name mismatch');
    console.log('✔ Get Project by ID passed');

    // 2. Update Project (general fields)
    res = await fetch(`${API_URL}/projects/${project.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ technology: 'Flutter & Express' })
    });
    if (res.status !== 200) throw new Error('Update project failed');
    const updatedProj = (await res.json()).data;
    if (updatedProj.technology !== 'Flutter & Express') throw new Error('Tech update not saved');
    console.log('✔ Project general update verified');


    // ==========================================
    // D. TEST EXECUTION PROGRESS
    // ==========================================
    console.log('\n[7] Testing Execution Progress updates...');

    // 1. Update progress (e.g. 50% progress)
    res = await fetch(`${API_URL}/projects/${project.id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${developerToken}`
      },
      body: JSON.stringify({ progress_pct: 50, status: 'In Progress', remarks: 'Backend services built' })
    });
    if (res.status !== 200) throw new Error('Update progress failed');
    const progressProj = (await res.json()).data;
    if (progressProj.progress_pct !== 50 || progressProj.status !== 'In Progress') throw new Error('Progress/status mismatch');
    console.log('✔ Progress updated to 50% successfully');

    // 2. Block progress decrease
    res = await fetch(`${API_URL}/projects/${project.id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${developerToken}`
      },
      body: JSON.stringify({ progress_pct: 40, remarks: 'Attempt decrease' })
    });
    console.log(`✔ Attempt progress decrease response: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Progress decrease must be blocked');

    // 3. Complete Project (progress = 100% auto-sets Completed status)
    res = await fetch(`${API_URL}/projects/${project.id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${developerToken}`
      },
      body: JSON.stringify({ progress_pct: 100, remarks: 'All features built and verified' })
    });
    if (res.status !== 200) throw new Error('Progress complete failed');
    const completedProj = (await res.json()).data;
    if (completedProj.progress_pct !== 100 || completedProj.status !== 'Completed') {
      throw new Error('Project status must automatically set to Completed when progress is 100%');
    }
    console.log('✔ Project 100% progress auto-completed successfully');


    // ==========================================
    // E. TEST STATISTICS Aggregation
    // ==========================================
    console.log('\n[8] Testing Project Statistics Aggregations...');

    res = await fetch(`${API_URL}/projects/statistics`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200) {
      const txt = await res.text();
      console.error(txt);
      throw new Error('Get statistics failed');
    }
    const stats = (await res.json()).data;
    console.log('✔ Statistics aggregates:', JSON.stringify(stats));
    if (stats.total_projects < 1 || stats.completed < 1) throw new Error('Statistics calculations mismatch');
    console.log('✔ Statistics counts verified correct');


    // ==========================================
    // F. SECURITY & CROSS-TENANT isolation
    // ==========================================
    console.log('\n[9] Testing security permissions & cross-tenant boundaries...');

    // 1. Cross Tenant Block
    res = await fetch(`${API_URL}/leads/${lead.id}/assignment`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${crossAdminToken}` }
    });
    console.log(`✔ Cross-tenant access check status: ${res.status} (Expected: 403 or 404)`);
    if (res.status !== 403 && res.status !== 404) throw new Error('Cross-tenant user must be blocked');

    // 2. Developer Role limit check
    // Developer try to delete project (should fail)
    res = await fetch(`${API_URL}/projects/${project.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${developerToken}` }
    });
    console.log(`✔ Developer DELETE project response: ${res.status} (Expected: 403)`);
    if (res.status !== 403) throw new Error('Developer must be blocked from deleting projects');

    console.log('\n=============================================');
    console.log('🎉 ALL PHASE 7E INTEGRATION TESTS PASSED! 🎉');
    console.log('=============================================');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    console.log('\n[10] Cleaning up test records...');
    try {
      await cleanupDb(dbClient, crossTenantId, crossBranchId, null, createdLeadIds);
      console.log('✔ Database cleanups completed successfully');
    } catch (cleanErr) {
      console.error('Cleanup failed:', cleanErr.message);
    }
    await dbClient.end();
    process.exit(process.exitCode || 0);
  }
}

runTests();
