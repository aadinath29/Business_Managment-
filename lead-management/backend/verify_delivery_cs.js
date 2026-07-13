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
    await client.query('DELETE FROM customer_success WHERE lead_id = ANY($1)', [leadIds]);
    await client.query('DELETE FROM lead_deliveries WHERE lead_id = ANY($1)', [leadIds]);
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
  console.log('=== STARTING DELIVERY & CUSTOMER SUCCESS INTEGRATION TESTS (PHASE 7F) ===');
  
  // 1. Authenticate users
  console.log('\n[1] Authenticating accounts...');
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
    const developerUserId = 'bbbb0000-0000-0000-0000-000000000004';  // Aarav Mehta

    // Setup cross tenant admin
    console.log('\n[2] Setting up cross-tenant test data...');
    crossTenantId = 'aaaa9999-8888-8888-8888-888888888888';
    await dbClient.query(`INSERT INTO tenants (id, name, status) VALUES ($1, 'CS Cross Tenant', 'Active') ON CONFLICT DO NOTHING`, [crossTenantId]);
    
    const passHash = '$2b$10$uoNhEr5tKgfCj3S/pzIzX.YmDi6aL2t/GDhkdxq/vUS4.5d6xvhhW';
    crossUserId = 'bbbb9999-8888-8888-8888-888888888888';
    await dbClient.query(`
      INSERT INTO users (id, tenant_id, role_id, email, password_hash, first_name, last_name, status)
      VALUES ($1, $2, '22222222-2222-2222-2222-222222222222', 'admin@cscross.com', $3, 'CS', 'Admin', 'Active')
      ON CONFLICT DO NOTHING
    `, [crossUserId, crossTenantId, passHash]);

    crossBranchId = 'cccc9999-8888-8888-8888-888888888888';
    await dbClient.query(`
      INSERT INTO branches (id, tenant_id, branch_name, branch_code, city, company_name)
      VALUES ($1, $2, 'CS Cross Branch', 'CCB99', 'Pune', 'CS Cross Comp')
      ON CONFLICT DO NOTHING
    `, [crossBranchId, crossTenantId]);

    crossAdminToken = await login('admin@cscross.com', 'Admin@123');
    console.log('✔ Cross-tenant Admin authenticated');

    // Create Lead (POST /api/v1/leads)
    console.log('\n[3] Creating test lead...');
    const payload = {
      name: 'Delivery CS Test Lead',
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

    // Assign Lead to Developer
    await fetch(`${API_URL}/leads/${lead.id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        assigned_team_id: validTeamId,
        assigned_to_user_id: developerUserId,
        reason: 'Assigning developer for project start',
        assignment_type: 'Developer'
      })
    });

    // ==========================================
    // A. TEST DELIVERY CREATION GUARDS
    // ==========================================
    console.log('\n[4] Testing Delivery creation guards...');

    // 1. Create Delivery before project exists (should fail)
    res = await fetch(`${API_URL}/leads/${lead.id}/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ uat_status: 'Pending' })
    });
    console.log(`✔ Delivery creation before project status: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Delivery must require completed project');

    // Create proposal, approve proposal, sign contract, create project
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
    await fetch(`${API_URL}/proposals/${prop.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${superAdminToken}` },
      body: JSON.stringify({ remarks: 'Looks great' })
    });
    await fetch(`${API_URL}/proposals/${prop.id}/sign-contract`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const projectRes = await fetch(`${API_URL}/leads/${lead.id}/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        project_name: 'CS Test Proj',
        technology: 'Express',
        total_cost: 18000
      })
    });
    const project = (await projectRes.json()).data;

    // 2. Create Delivery before project status is Completed (should fail)
    res = await fetch(`${API_URL}/leads/${lead.id}/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ uat_status: 'Pending' })
    });
    console.log(`✔ Delivery creation before project completed status: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Delivery must require completed project status');

    // Mark project Completed
    await fetch(`${API_URL}/projects/${project.id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${developerToken}`
      },
      body: JSON.stringify({ progress_pct: 100, remarks: 'Completed all work' })
    });

    // 3. Create Delivery (should succeed)
    res = await fetch(`${API_URL}/leads/${lead.id}/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        go_live_date: '2026-07-02',
        uat_status: 'Approved',
        documentation_delivered: true,
        training_completed: true,
        client_acceptance: 'Accepted',
        deployment_status: 'Deployed',
        delivery_remarks: 'Successful deployment'
      })
    });
    if (res.status !== 201) {
      const err = await res.json();
      console.error(err);
      throw new Error(`Delivery creation failed: ${res.status}`);
    }
    const delivery = (await res.json()).data;
    console.log(`✔ Delivery record created successfully: ID=${delivery.id}`);

    // Verify activity logs generated
    let actRes = await dbClient.query('SELECT * FROM lead_activities WHERE lead_id = $1 AND activity_type = $2', [lead.id, 'Delivery Created']);
    if (actRes.rows.length === 0) throw new Error('No activity for Delivery Created found');
    console.log('✔ "Delivery Created" activity log verified');

    // 4. Duplicate Delivery creation (should fail)
    res = await fetch(`${API_URL}/leads/${lead.id}/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ uat_status: 'Pending' })
    });
    console.log(`✔ Duplicate delivery creation response: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Duplicate delivery record must be blocked');


    // ==========================================
    // B. TEST DELIVERY UPDATE & CRUD
    // ==========================================
    console.log('\n[5] Testing Delivery CRUD and Updates...');

    // 1. Get Delivery nested
    res = await fetch(`${API_URL}/leads/${lead.id}/delivery`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200) throw new Error('Get nested delivery failed');
    const nestedDelivery = (await res.json()).data;
    if (nestedDelivery.uat_status !== 'Approved') throw new Error('Delivery status mismatch');
    console.log('✔ Get nested delivery verified');

    // 2. Update Delivery
    res = await fetch(`${API_URL}/delivery/${delivery.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        uat_remarks: 'All features accepted after review',
        training_completed: true
      })
    });
    if (res.status !== 200) throw new Error('Update delivery failed');
    const updatedDelivery = (await res.json()).data;
    if (updatedDelivery.uat_remarks !== 'All features accepted after review') throw new Error('UAT Remarks update not saved');
    console.log('✔ Delivery update verified');


    // ==========================================
    // C. TEST CUSTOMER SUCCESS
    // ==========================================
    console.log('\n[6] Testing Customer Success operations...');

    // 1. Create CS (Health Score validation)
    res = await fetch(`${API_URL}/leads/${lead.id}/customer-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        health_score: 150, // invalid (must be 0-100)
        nps: 50,
        renewal_date: '2026-08-02'
      })
    });
    console.log(`✔ Create CS with invalid Health Score response: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Health score validation failed to catch overflow');

    // 2. Create CS (Renewal Date before Go Live validation)
    res = await fetch(`${API_URL}/leads/${lead.id}/customer-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        health_score: 90,
        nps: 50,
        renewal_date: '2026-06-02' // before go_live_date '2026-07-02'
      })
    });
    console.log(`✔ Create CS with Renewal Date before Go Live response: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Renewal date boundary validation failed');

    // 3. Create CS (successful)
    res = await fetch(`${API_URL}/leads/${lead.id}/customer-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        health_score: 85,
        nps: 70,
        renewal_date: '2026-09-02',
        feedback: 'Fantastic delivery and project management experience',
        amc_status: 'Active',
        support_plan: 'Premium Support Plan',
        success_manager: 'Neha Sharma'
      })
    });
    if (res.status !== 201) {
      const err = await res.json();
      console.error(err);
      throw new Error(`Customer Success creation failed: ${res.status}`);
    }
    const cs = (await res.json()).data;
    console.log(`✔ Customer Success record created: ID=${cs.id}`);

    // Verify activity logged
    actRes = await dbClient.query('SELECT * FROM lead_activities WHERE lead_id = $1 AND activity_type = $2', [lead.id, 'Customer Success Created']);
    if (actRes.rows.length === 0) throw new Error('No activity for CS Created found');
    console.log('✔ "Customer Success Created" activity log verified');

    // 4. Duplicate CS record (should fail due to unique constraint)
    res = await fetch(`${API_URL}/leads/${lead.id}/customer-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ health_score: 75 })
    });
    console.log(`✔ Duplicate CS creation response: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Duplicate CS record must be blocked');

    // 5. Update CS
    res = await fetch(`${API_URL}/customer-success/${cs.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        health_score: 95,
        feedback: 'Extremely satisfied with the team'
      })
    });
    if (res.status !== 200) throw new Error('Update CS failed');
    const updatedCs = (await res.json()).data;
    if (updatedCs.health_score !== 95) throw new Error('Health score update failed to save');
    console.log('✔ Customer Success update verified');

    // Verify health score updated activity logged
    actRes = await dbClient.query('SELECT * FROM lead_activities WHERE lead_id = $1 AND activity_type = $2', [lead.id, 'Health Score Updated']);
    if (actRes.rows.length === 0) throw new Error('No activity for Health Score Updated found');
    console.log('✔ "Health Score Updated" activity log verified');


    // ==========================================
    // D. TEST SEARCH & FILTERING
    // ==========================================
    console.log('\n[7] Testing Deliveries & CS Search/Filtering lists...');

    res = await fetch(`${API_URL}/delivery?delivery_status=Approved&limit=5&page=1`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200) throw new Error('Search delivery failed');
    const delList = (await res.json()).data;
    if (delList.length === 0) throw new Error('Expected results in search deliveries');
    console.log('✔ Deliveries search and pagination verified');

    res = await fetch(`${API_URL}/customer-success?health_score_min=80&limit=5`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    if (res.status !== 200) throw new Error('Search CS failed');
    const csList = (await res.json()).data;
    if (csList.length === 0) throw new Error('Expected results in search CS');
    console.log('✔ Customer Success search filters verified');


    // ==========================================
    // E. SECURITY, CROSS-TENANT & RBAC
    // ==========================================
    console.log('\n[8] Testing Security bounds...');

    // 1. Cross tenant block
    res = await fetch(`${API_URL}/leads/${lead.id}/delivery`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${crossAdminToken}` }
    });
    console.log(`✔ Cross-tenant access check response: ${res.status} (Expected: 403 or 404)`);
    if (res.status !== 403 && res.status !== 404) throw new Error('Cross-tenant user must be blocked');

    // 2. Developer read-only block
    res = await fetch(`${API_URL}/delivery/${delivery.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${developerToken}` }
    });
    console.log(`✔ Developer delete delivery response: ${res.status} (Expected: 403)`);
    if (res.status !== 403) throw new Error('Developer must be blocked from writing/deleting deliveries');

    console.log('\n=============================================');
    console.log('🎉 ALL PHASE 7F INTEGRATION TESTS PASSED! 🎉');
    console.log('=============================================');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    console.log('\n[9] Cleaning up test records...');
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
