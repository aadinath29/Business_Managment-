const { Client } = require('pg');
const path = require('path');
const backendDir = __dirname;
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
async function cleanupDb(client, leadId) {
  if (leadId) {
    await client.query('DELETE FROM customer_success WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM lead_deliveries WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM lead_activities WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM projects WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM proposals WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM lead_requirements WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM lead_followups WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM communications WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM lead_notes WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM lead_assignments WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM lead_status_history WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM lead_journey WHERE lead_id = $1', [leadId]);
    await client.query('DELETE FROM leads WHERE id = $1', [leadId]);
  }
}

async function runTests() {
  console.log('=== STARTING END-TO-END LEAD LIFECYCLE STABILIZATION TESTS (PHASE 7G) ===');
  
  // 1. Authenticate users
  console.log('\n[1] Authenticating test accounts...');
  const adminToken = await login('admin@antigravity.com', 'Admin@123');
  const tlToken = await login('rohan.verma@kosqu.com', 'TL@12345');
  const devToken = await login('aarav.mehta@kosqu.com', 'Dev@12345');
  
  console.log('✔ Admin authenticated');
  console.log('✔ Team Leader authenticated');
  console.log('✔ Developer authenticated');

  const dbClient = getDbClient();
  await dbClient.connect();

  let leadId = null;

  try {
    const validBranchId = 'cccc0000-0000-0000-0000-000000000001'; // Kosque Advertisement (Mumbai)
    const validTeamId = 'dddd0000-0000-0000-0000-000000000001';   // Mumbai Avengers
    const developerUserId = 'bbbb0000-0000-0000-0000-000000000004';  // Aarav Mehta

    // 2. Create Lead
    console.log('\n[2] Creating a new lead...');
    const createRes = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Stabilization Rebuild Lead',
        company_name: 'StabCorp Ltd',
        contact_person: 'Amit Stab',
        email: `amit_${Date.now()}@stabcorp.com`,
        mobile: '+919999988888',
        website: 'stabcorp.com',
        industry: 'Services',
        address: '101 Stab Street',
        city: 'Mumbai',
        country: 'India',
        lead_source: 'Website Inquiry',
        website_inquiry: true,
        budget: 6500000,
        expected_revenue: 6000000,
        expected_start_date: '2026-08-01',
        business_need: 'Complete platform migration',
        project_type: 'Custom Software',
        priority: 'High',
        branch_id: validBranchId
      })
    });
    
    if (!createRes.ok) {
      const errorJson = await createRes.json().catch(() => ({}));
      throw new Error(`Lead creation failed: ${createRes.statusText} - ${JSON.stringify(errorJson)}`);
    }
    const createJson = await createRes.json();
    leadId = createJson.data.id;
    console.log(`✔ Lead created successfully. ID: ${leadId}`);

    // 3. Update Lead
    console.log('\n[3] Updating lead...');
    const updateRes = await fetch(`${API_URL}/leads/${leadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        budget: 7000000,
        priority: 'High'
      })
    });
    if (!updateRes.ok) throw new Error(`Lead update failed: ${updateRes.statusText}`);
    console.log('✔ Lead updated successfully');

    // 4. Lead Journey
    console.log('\n[4] Retrieving and updating lead journey stage...');
    const journeyGet = await fetch(`${API_URL}/leads/${leadId}/journey`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!journeyGet.ok) throw new Error(`Fetch journey failed`);
    
    const journeyPatch = await fetch(`${API_URL}/leads/${leadId}/journey`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ stage: 'Discovery' })
    });
    if (!journeyPatch.ok) throw new Error(`Patch journey failed`);
    console.log('✔ Lead Journey stage Discovery successfully patched');

    // 5. Timeline
    console.log('\n[5] Verifying timeline retrieval...');
    const timelineGet = await fetch(`${API_URL}/leads/${leadId}/timeline`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!timelineGet.ok) throw new Error(`Fetch timeline failed`);
    const timelineJson = await timelineGet.json();
    console.log(`✔ Timeline returned ${timelineJson.data.length} activities`);

    // 6. Lead Notes
    console.log('\n[6] Testing Lead Notes CRUD...');
    const noteCreate = await fetch(`${API_URL}/leads/${leadId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ content: 'Initial requirements analysis note' })
    });
    if (!noteCreate.ok) throw new Error(`Create note failed`);
    const noteJson = await noteCreate.json();
    const noteId = noteJson.data.id;
    console.log(`✔ Note created: ID=${noteId}`);

    const notesList = await fetch(`${API_URL}/leads/${leadId}/notes`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!notesList.ok) throw new Error(`List notes failed`);

    const notePatch = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ content: 'Updated requirements analysis note' })
    });
    if (!notePatch.ok) throw new Error(`Patch note failed`);
    console.log('✔ Note updated successfully');

    const noteDelete = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!noteDelete.ok) throw new Error(`Delete note failed`);
    console.log('✔ Note deleted successfully');

    // 7. Communications
    console.log('\n[7] Testing Communications...');
    const commCreate = await fetch(`${API_URL}/leads/${leadId}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        type: 'Call',
        comm_date: new Date().toISOString(),
        subject: 'Introductory Discovery Call',
        discussion_summary: 'Reviewed budget plans and primary goals.',
        success_status: true
      })
    });
    if (!commCreate.ok) {
      const errorJson = await commCreate.json().catch(() => ({}));
      throw new Error(`Create communication failed: ${JSON.stringify(errorJson)}`);
    }
    console.log('✔ Communication logged successfully');

    // 8. Follow-up
    console.log('\n[8] Testing Follow-ups...');
    const followCreate = await fetch(`${API_URL}/leads/${leadId}/followups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        followup_date: '2026-07-15T10:00:00Z',
        reminder_notes: 'Send technical architecture proposal',
        status: 'Pending'
      })
    });
    if (!followCreate.ok) {
      const errorJson = await followCreate.json().catch(() => ({}));
      throw new Error(`Create follow-up failed: ${JSON.stringify(errorJson)}`);
    }
    console.log('✔ Follow-up scheduled successfully');

    // 9. Requirements
    console.log('\n[9] Testing Requirements CRUD...');
    const reqCreate = await fetch(`${API_URL}/leads/${leadId}/requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        requirement: 'Complete UI modernization using React & Tailwind',
        priority: 'High',
        estimated_hours: 120,
        remarks: 'Client prefers Outfit typography'
      })
    });
    if (!reqCreate.ok) {
      const errorJson = await reqCreate.json().catch(() => ({}));
      throw new Error(`Create requirement failed: ${JSON.stringify(errorJson)}`);
    }
    const reqJson = await reqCreate.json();
    const reqId = reqJson.data.id;
    console.log(`✔ Requirement created: ID=${reqId}`);

    const reqPatch = await fetch(`${API_URL}/requirements/${reqId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        approved: true,
        estimated_hours: 130
      })
    });
    if (!reqPatch.ok) {
      const errorJson = await reqPatch.json().catch(() => ({}));
      throw new Error(`Patch requirement failed: ${JSON.stringify(errorJson)}`);
    }
    console.log('✔ Requirement approved successfully');

    // 10. Proposals
    console.log('\n[10] Testing Proposal Creation...');
    const propCreate = await fetch(`${API_URL}/leads/${leadId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        proposal_version: 'v1.0',
        business_analysis: 'Migration will optimize business efficiency by 30%',
        technical_analysis: 'React framework with Node.js Postgres backend',
        risk_analysis: 'Timeline overrun risk mitigated by agile sprints',
        scope: 'Login module, Lead journeys, proposal management, customer success',
        timeline: '10 Weeks',
        est_hours: 400,
        quotation_amount: 6000000,
        discount: 200000,
        currency: 'INR',
        status: 'Draft'
      })
    });
    if (!propCreate.ok) throw new Error(`Create proposal failed`);
    const propJson = await propCreate.json();
    const propId = propJson.data.id;
    console.log(`✔ Proposal created: ID=${propId}`);

    // 11. Approve Proposal
    console.log('\n[11] Approving Proposal...');
    const propApprove = await fetch(`${API_URL}/proposals/${propId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ remarks: 'Budget approved by Client CFO' })
    });
    if (!propApprove.ok) throw new Error(`Approve proposal failed`);
    console.log('✔ Proposal status marked as Approved');

    // 12. Sign Contract
    console.log('\n[12] Signing Contract...');
    const propSign = await fetch(`${API_URL}/proposals/${propId}/sign-contract`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!propSign.ok) throw new Error(`Sign contract failed`);
    console.log('✔ Proposal contract signed');

    // 13. Receive Advance
    console.log('\n[13] Receiving Advance...');
    const propAdvance = await fetch(`${API_URL}/proposals/${propId}/receive-advance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ advance_amount: 1500000 })
    });
    if (!propAdvance.ok) throw new Error(`Receive advance failed`);
    console.log('✔ Advance payment received & logged');

    // 14. Assign Team
    console.log('\n[14] Assigning Lead to Team Mumbai Avengers...');
    const assignTeam = await fetch(`${API_URL}/leads/${leadId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        assigned_team_id: validTeamId,
        reason: 'CRM development expertise required',
        assignment_type: 'Team'
      })
    });
    if (!assignTeam.ok) throw new Error(`Assign team failed`);
    console.log('✔ Lead successfully assigned to Team');

    // 15. Assign Developer
    console.log('\n[15] Assigning Developer to Lead...');
    const assignDev = await fetch(`${API_URL}/leads/${leadId}/reassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tlToken}` // Action by TL
      },
      body: JSON.stringify({
        assigned_team_id: validTeamId,
        assigned_to_user_id: developerUserId,
        reason: 'Assigning Aarav as primary developer',
        assignment_type: 'Developer'
      })
    });
    if (!assignDev.ok) throw new Error(`Assign developer failed`);
    console.log('✔ Lead successfully assigned to Developer');

    // 16. Create Project
    console.log('\n[16] Creating Execution Project...');
    const projCreate = await fetch(`${API_URL}/leads/${leadId}/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tlToken}`
      },
      body: JSON.stringify({
        project_name: 'StabCorp CRM Migration',
        technology: 'React, Express, PostgreSQL',
        total_cost: 5800000,
        start_date: '2026-07-10',
        deadline: '2026-09-10'
      })
    });
    if (!projCreate.ok) {
      const errorJson = await projCreate.json().catch(() => ({}));
      throw new Error(`Create project failed: ${projCreate.statusText} - ${JSON.stringify(errorJson)}`);
    }
    const projJson = await projCreate.json();
    const projectId = projJson.data.id;
    console.log(`✔ Project created: ID=${projectId}`);

    // 17. Project Progress
    console.log('\n[17] Updating Project Progress to 100% and Completed status...');
    const projProgress = await fetch(`${API_URL}/projects/${projectId}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}` // Developer updates progress
      },
      body: JSON.stringify({ progress_pct: 100, remarks: 'All features built & verified' })
    });
    if (!projProgress.ok) throw new Error(`Update progress failed`);
    
    const projStatus = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tlToken}` // TL completes project
      },
      body: JSON.stringify({ status: 'Completed', remarks: 'Client demo approved' })
    });
    if (!projStatus.ok) throw new Error(`Complete project failed`);
    console.log('✔ Project successfully Completed');

    // 18. Delivery Module
    console.log('\n[18] Logging Delivery & Handover details...');
    const delCreate = await fetch(`${API_URL}/leads/${leadId}/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tlToken}`
      },
      body: JSON.stringify({
        go_live_date: '2026-07-20',
        uat_status: 'Approved',
        documentation_status: 'Delivered',
        acceptance_status: 'Accepted',
        handover_completed: true,
        deployment_date: '2026-07-18',
        remarks: 'Client signed off on final acceptance testing'
      })
    });
    if (!delCreate.ok) throw new Error(`Create delivery failed`);
    const delJson = await delCreate.json();
    const deliveryId = delJson.data.id;
    console.log(`✔ Delivery logged successfully: ID=${deliveryId}`);

    // 19. Customer Success Module
    console.log('\n[19] Logging Customer Success & AMC details...');
    const csCreate = await fetch(`${API_URL}/leads/${leadId}/customer-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tlToken}`
      },
      body: JSON.stringify({
        support_status: 'Active',
        renewal_date: '2027-07-20',
        health_score: 95,
        nps: 90,
        feedback: 'Fantastic team. Project delivered ahead of timeline.',
        upsell_opportunity: true,
        renewal_status: 'Active'
      })
    });
    if (!csCreate.ok) throw new Error(`Create CS failed`);
    const csJson = await csCreate.json();
    const csId = csJson.data.id;
    console.log(`✔ Customer Success logged successfully: ID=${csId}`);

    // 20. Lead Closed Won
    console.log('\n[20] Marking Lead as Closed Won...');
    const leadClose = await fetch(`${API_URL}/leads/${leadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Closed Won' })
    });
    if (!leadClose.ok) throw new Error(`Close won lead failed`);
    console.log('✔ Lead status marked as Closed Won');

    // === INTEGRITY DATABASE VERIFICATION ===
    console.log('\n[Database Integrity Verifications]');
    const leadRow = await dbClient.query('SELECT status, budget FROM leads WHERE id = $1', [leadId]);
    console.log(`- Lead status in DB: ${leadRow.rows[0].status} (Expected: Closed Won)`);
    console.log(`- Lead budget in DB: ${leadRow.rows[0].budget} (Expected: 7000000)`);

    const journeyRow = await dbClient.query('SELECT stage FROM lead_journey WHERE lead_id = $1', [leadId]);
    console.log(`- Journey stage in DB: ${journeyRow.rows[0].stage} (Expected: Discovery)`);

    const historyRows = await dbClient.query('SELECT old_status, new_status FROM lead_status_history WHERE lead_id = $1 ORDER BY changed_at ASC', [leadId]);
    console.log(`- Status history count: ${historyRows.rows.length} rows`);

    const assignRows = await dbClient.query('SELECT assigned_team_id, assigned_to_user_id, is_current FROM lead_assignments WHERE lead_id = $1 ORDER BY assigned_date ASC', [leadId]);
    console.log(`- Assignment rows: ${assignRows.rows.length} rows`);

    const projectRow = await dbClient.query('SELECT status, progress_pct FROM projects WHERE lead_id = $1', [leadId]);
    console.log(`- Project status in DB: ${projectRow.rows[0].status} (Expected: Completed)`);
    console.log(`- Project progress in DB: ${projectRow.rows[0].progress_pct}% (Expected: 100%)`);

    const deliveryRow = await dbClient.query('SELECT uat_status, acceptance_status FROM lead_deliveries WHERE lead_id = $1', [leadId]);
    console.log(`- Delivery UAT status in DB: ${deliveryRow.rows[0].uat_status} (Expected: Approved)`);

    const csRow = await dbClient.query('SELECT health_score, nps FROM customer_success WHERE lead_id = $1', [leadId]);
    console.log(`- CS Health score in DB: ${csRow.rows[0].health_score} (Expected: 95)`);

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: END-TO-END LEAD LIFECYCLE VERIFIED! 🎉');
    console.log('======================================================');

  } catch (error) {
    console.error('❌ LIFECYCLE TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    console.log('\n[Cleaning up test data]');
    await cleanupDb(dbClient, leadId);
    await dbClient.end();
    console.log('✔ Cleanup completed successfully');
  }
}

runTests();
