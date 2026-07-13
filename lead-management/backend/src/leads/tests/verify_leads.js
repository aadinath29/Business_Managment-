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
  console.log('=== STARTING LEAD CRUD VERIFICATION TESTS ===');
  
  // 1. Authenticate users
  console.log('\n[1] Authenticating test accounts...');
  const superAdminToken = await login('admin@antigravity.com', 'Admin@123');
  const adminToken = await login('pooja.hegde@kosqueadv.com', 'BM@12345');
  const teamLeaderToken = await login('rohan.verma@kosqu.com', 'TL@12345');
  const developerToken = await login('aarav.mehta@kosqu.com', 'Dev@12345');
  
  console.log('✔ Super Admin authenticated');
  console.log('✔ Admin authenticated');
  console.log('✔ Team Leader authenticated');
  console.log('✔ Developer authenticated');

  // Let's connect to database to set up cross-tenant test data and read results directly
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

    // Setup cross tenant admin
    console.log('\n[2] Setting up cross-tenant test data...');
    crossTenantId = 'aaaa9999-9999-9999-9999-999999999999';
    await dbClient.query(`INSERT INTO tenants (id, name, status) VALUES ($1, 'Cross Tenant Ltd', 'Active') ON CONFLICT DO NOTHING`, [crossTenantId]);
    
    // Hash password 'Admin@123' using same pre-seeded hash value
    const passHash = '$2b$10$uoNhEr5tKgfCj3S/pzIzX.YmDi6aL2t/GDhkdxq/vUS4.5d6xvhhW';
    crossUserId = 'bbbb9999-9999-9999-9999-999999999999';
    await dbClient.query(`
      INSERT INTO users (id, tenant_id, role_id, email, password_hash, first_name, last_name, status)
      VALUES ($1, $2, '22222222-2222-2222-2222-222222222222', 'admin@crosstenant.com', $3, 'Cross', 'Admin', 'Active')
      ON CONFLICT DO NOTHING
    `, [crossUserId, crossTenantId, passHash]);

    crossBranchId = 'cccc9999-9999-9999-9999-999999999999';
    await dbClient.query(`
      INSERT INTO branches (id, tenant_id, branch_name, branch_code, city, company_name)
      VALUES ($1, $2, 'Cross Branch', 'CB999', 'Delhi', 'Cross Comp')
      ON CONFLICT DO NOTHING
    `, [crossBranchId, crossTenantId]);

    crossAdminToken = await login('admin@crosstenant.com', 'Admin@123');
    console.log('✔ Cross tenant login token acquired');

    // 2. Create Lead (POST /api/v1/leads)
    console.log('\n[3] Testing Lead Creation (POST /api/v1/leads)...');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const leadPayload = {
      name: 'Acme CRM System Integration',
      branch_id: validBranchId,
      team_id: validTeamId,
      company_name: 'Acme Corp',
      contact_person: 'John Doe',
      mobile: '+91 99999 88888',
      email: 'john.doe@acme.com',
      industry: 'Software',
      address: '123 Main St, Mumbai',
      city: 'Mumbai',
      lead_source: 'Website Search',
      budget: 150000.00,
      expected_revenue: 180000.00,
      lead_score: 85,
      priority: 'High',
      status: 'New',
      expected_start_date: futureDateStr,
      next_follow_up_date: futureDateStr,
      reminder_notes: 'Discuss requirements'
    };

    let res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify(leadPayload)
    });

    console.log(`Response status: ${res.status}`);
    const createJson = await res.json();
    if (res.status !== 201) {
      console.error(createJson);
      throw new Error('Create lead failed');
    }
    const createdLead = createJson.data;
    createdLeadIds.push(createdLead.id);
    console.log(`✔ Lead created successfully with ID: ${createdLead.id}`);

    // Verify database population of tenant_id
    if (createdLead.tenant_id !== 'aaaa0000-0000-0000-0000-000000000000') {
      throw new Error(`tenant_id mismatch! Expected aaaa0000-0000-0000-0000-000000000000, got ${createdLead.tenant_id}`);
    }
    console.log('✔ tenant_id correctly populated in lead record');

    // Try creating a lead passing client-side tenant_id and verify it is rejected
    const bypassTenantPayload = { ...leadPayload, email: 'john.bypass@acme.com', tenant_id: crossTenantId };
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify(bypassTenantPayload)
    });
    console.log(`Response status for tenant_id parameter request: ${res.status}`);
    if (res.status !== 400) {
      throw new Error('Security Breach: client-supplied tenant_id was not rejected by strict schema!');
    }
    console.log('✔ tenant_id input parameter successfully rejected by strict validation schema');

    // 3. Validation tests
    console.log('\n[4] Testing Schema Validations...');

    // Unknown field rejection
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ ...leadPayload, email: 'john.val1@acme.com', unknown_field: 'hack' })
    });
    console.log(`✔ Unknown field rejection: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Unknown field should be rejected');

    // Duplicate email check
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ ...leadPayload, name: 'Duplicate Email Trial' })
    });
    console.log(`✔ Duplicate Email rejection: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Duplicate email should be rejected');

    // Invalid UUID branch
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ ...leadPayload, branch_id: 'not-a-uuid', email: 'john.val2@acme.com' })
    });
    console.log(`✔ Invalid UUID format rejection: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Invalid UUID format should be rejected');

    // Non-existent Branch
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ ...leadPayload, branch_id: 'cccc0000-0000-0000-0000-999999999999', email: 'john.val3@acme.com' })
    });
    console.log(`✔ Non-existent Branch rejection: ${res.status} (Expected: 404)`);
    if (res.status !== 404) throw new Error('Non-existent Branch should be rejected with 404');

    // Non-existent Team
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ ...leadPayload, team_id: 'dddd0000-0000-0000-0000-999999999999', email: 'john.val4@acme.com' })
    });
    console.log(`✔ Non-existent Team rejection: ${res.status} (Expected: 404)`);
    if (res.status !== 404) throw new Error('Non-existent Team should be rejected with 404');

    // Team belonging to different branch
    // Rohan's branch is cccc0000-0000-0000-0000-000000000001, but Pune Office is cccc0000-0000-0000-0000-000000000002
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ ...leadPayload, branch_id: 'cccc0000-0000-0000-0000-000000000002', email: 'john.val5@acme.com' })
    });
    console.log(`✔ Branch-Team mismatch rejection: ${res.status} (Expected: 404)`);
    if (res.status !== 404) throw new Error('Mismatched branch-team context should be rejected with 404');

    // Negative currency expected revenue
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ ...leadPayload, expected_revenue: -50, email: 'john.val6@acme.com' })
    });
    console.log(`✔ Negative currency rejection: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Negative expected revenue should be rejected');

    // Past expected start date
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ ...leadPayload, expected_start_date: '2020-01-01', email: 'john.val7@acme.com' })
    });
    console.log(`✔ Past expected start date rejection: ${res.status} (Expected: 400)`);
    if (res.status !== 400) throw new Error('Past expected start date should be rejected');

    // 4. RBAC Permissions validation
    console.log('\n[5] Testing RBAC controls...');
    
    // Developer write attempt
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${developerToken}`
      },
      body: JSON.stringify({ ...leadPayload, email: 'dev.try@acme.com' })
    });
    console.log(`✔ Developer Create rejection: ${res.status} (Expected: 403)`);
    if (res.status !== 403) throw new Error('Developer should not be allowed to create a lead');

    // Team Leader write attempt
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teamLeaderToken}`
      },
      body: JSON.stringify({ ...leadPayload, email: 'tl.try@acme.com' })
    });
    console.log(`✔ Team Leader Create rejection: ${res.status} (Expected: 403)`);
    if (res.status !== 403) throw new Error('Team Leader should not be allowed to create a lead');

    // Developer list attempt
    res = await fetch(`${API_URL}/leads`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${developerToken}` }
    });
    console.log(`✔ Developer GET List rejection: ${res.status} (Expected: 403)`);
    if (res.status !== 403) throw new Error('Developer should not be allowed to view leads list');

    // 5. GET BY ID (GET /api/v1/leads/:id)
    console.log('\n[6] Testing GET BY ID (GET /api/v1/leads/:id)...');
    
    res = await fetch(`${API_URL}/leads/${createdLead.id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const getByIdJson = await res.json();
    if (res.status !== 200) throw new Error('GET BY ID failed');
    const leadDetails = getByIdJson.data;
    console.log(`✔ Get By ID returned code 200`);
    console.log(`✔ Joined fields check: BranchName="${leadDetails.branch_name}", TeamName="${leadDetails.team_name}"`);
    
    if (!leadDetails.branch_name || !leadDetails.team_name) {
      throw new Error('Joined fields are missing in lead details response');
    }

    // 6. Team Leader Isolation
    console.log('\n[7] Testing Team Leader lead isolation...');
    
    // Create a lead not assigned to Rohan Verma's team (Mumbai Avengers dddd0000-0000-0000-0000-000000000001)
    const otherTeamLeadPayload = {
      ...leadPayload,
      name: 'Unassigned Team Lead',
      team_id: null, // Null team, not Rohan's team
      email: 'unassigned@acme.com'
    };
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify(otherTeamLeadPayload)
    });
    const otherLead = (await res.json()).data;
    createdLeadIds.push(otherLead.id);
    console.log(`✔ Created secondary unassigned lead: ${otherLead.id}`);

    // Team leader Rohan tries to fetch this other lead directly
    res = await fetch(`${API_URL}/leads/${otherLead.id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${teamLeaderToken}` }
    });
    console.log(`✔ Team Leader direct access block for other team's lead: ${res.status} (Expected: 403)`);
    if (res.status !== 403) throw new Error('Team Leader should not access other team leads');

    // Team leader Rohan lists leads
    res = await fetch(`${API_URL}/leads`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${teamLeaderToken}` }
    });
    const tlListJson = await res.json();
    const tlLeads = tlListJson.data;
    const hasOtherLead = tlLeads.some(l => l.id === otherLead.id);
    const hasOwnLead = tlLeads.some(l => l.id === createdLead.id);

    console.log(`✔ Team Leader list filtered check: Has Own Team Lead = ${hasOwnLead}, Has Other Team Lead = ${hasOtherLead}`);
    if (hasOtherLead) {
      throw new Error('Team Leader list contains unassigned/cross-team lead records!');
    }
    if (!hasOwnLead) {
      console.error('DEBUG: Rohan Verma lead list response:', tlListJson);
      throw new Error('Team Leader list failed to return their own team lead records!');
    }

    // 7. Cross Tenant Protection
    console.log('\n[8] Testing Cross-Tenant security...');
    
    // Cross tenant tries to get lead from first tenant
    res = await fetch(`${API_URL}/leads/${createdLead.id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${crossAdminToken}` }
    });
    console.log(`✔ Cross-tenant GET by ID access block: ${res.status} (Expected: 404)`);
    if (res.status !== 404) throw new Error('Cross-tenant resource fetch should return 404 Not Found');

    // Cross tenant tries to create a lead under first tenant's branch
    const crossTenantCreatePayload = {
      ...leadPayload,
      email: 'cross.try@acme.com',
      branch_id: validBranchId // validBranchId belongs to tenant 1
    };
    res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${crossAdminToken}`
      },
      body: JSON.stringify(crossTenantCreatePayload)
    });
    console.log(`✔ Cross-tenant Branch validation block: ${res.status} (Expected: 404)`);
    if (res.status !== 404) throw new Error('Attempting to create lead referencing a cross-tenant branch_id must fail');

    // 8. Lead Update (PATCH /api/v1/leads/:id)
    console.log('\n[9] Testing Lead Update (PATCH /api/v1/leads/:id)...');
    
    const updatePayload = {
      company_name: 'Acme Systems Ltd',
      budget: 165000.00
    };
    res = await fetch(`${API_URL}/leads/${createdLead.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify(updatePayload)
    });
    const updateJson = await res.json();
    if (res.status !== 200) throw new Error('Update lead failed');
    const updatedLead = updateJson.data;
    console.log(`✔ Update returned code 200`);
    
    // Verify changes and preservation of unchanged attributes
    if (updatedLead.company_name !== 'Acme Systems Ltd' || Number(updatedLead.budget) !== 165000) {
      throw new Error('Update payload fields not correctly saved');
    }
    if (updatedLead.contact_person !== 'John Doe') {
      throw new Error('Unmodified fields were overwritten during partial update');
    }
    console.log('✔ Modified fields saved correctly; unmodified fields preserved intact');

    // Verify updated_at is refreshed
    const createdTime = new Date(createdLead.created_at).getTime();
    const updatedTime = new Date(updatedLead.updated_at).getTime();
    if (updatedTime <= createdTime) {
      throw new Error('updated_at was not updated automatically');
    }
    console.log('✔ updated_at successfully updated');

    // 9. Lead Delete (DELETE /api/v1/leads/:id)
    console.log('\n[10] Testing Soft Delete (DELETE /api/v1/leads/:id)...');
    
    res = await fetch(`${API_URL}/leads/${createdLead.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    console.log(`✔ Delete request response: ${res.status} (Expected: 200)`);
    if (res.status !== 200) throw new Error('Delete lead failed');

    // Verify subsequent GET returns 404
    res = await fetch(`${API_URL}/leads/${createdLead.id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    console.log(`✔ GET on deleted lead returns: ${res.status} (Expected: 404)`);
    if (res.status !== 404) throw new Error('GET on soft-deleted lead should return 404');

    // Direct database validation of soft delete
    const dbRes = await dbClient.query('SELECT deleted_at FROM leads WHERE id = $1', [createdLead.id]);
    const deletedAt = dbRes.rows[0].deleted_at;
    console.log(`✔ Direct DB check: deleted_at = ${deletedAt}`);
    if (!deletedAt) {
      throw new Error('deleted_at was not populated in the database for the soft-deleted lead');
    }
    console.log('✔ Soft delete verified in database successfully');

    console.log('\n=============================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('=============================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    // 10. Database Cleanup
    console.log('\n[11] Cleaning up test database records...');
    try {
      await cleanupDb(dbClient, crossTenantId, crossBranchId, null, createdLeadIds);
      console.log('✔ Cleanup completed successfully');
    } catch (cleanErr) {
      console.error('Cleanup failed:', cleanErr.message);
    }
    await dbClient.end();
    process.exit(process.exitCode || 0);
  }
}

runTests();
