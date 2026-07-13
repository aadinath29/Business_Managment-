require('dotenv').config(); const pool = require('./src/database/index');
const requestContext = require('./src/utils/requestContext');
const leadRepository = require('./src/leads/repositories/leadRepository');
const dashboardRepository = require('./src/modules/dashboard/repositories/dashboardRepository');
const taskRepository = require('./src/tasks/repositories/taskRepository');

// pool imported

// Monkey patch db required by repositories


async function runTests() {
  console.log('--- Starting Scoping Verification Tests ---');

  // Let's assume tenantId 1
  const tenantId = '10000000-0000-0000-0000-000000000000';

  // Use dummy UUIDs
  const superAdmin = { id: '00000000-0000-0000-0000-000000000001' };
  const branchAdmin = { user_id: '00000000-0000-0000-0000-000000000002', branch_id: '10000000-0000-0000-0000-000000000000' };
  const teamLeader = { user_id: '00000000-0000-0000-0000-000000000003', branch_id: '10000000-0000-0000-0000-000000000000', team_id: '20000000-0000-0000-0000-000000000000' };
  const developer = { user_id: '00000000-0000-0000-0000-000000000004', branch_id: '10000000-0000-0000-0000-000000000000', team_id: '20000000-0000-0000-0000-000000000000' };

  const testCases = [
    {
      name: 'Super Admin',
      context: {
        userId: superAdmin.id,
        tenantId,
        role: 'SUPER_ADMIN',
        scope: {}
      }
    },
    {
      name: 'Branch Admin',
      context: {
        userId: branchAdmin.user_id,
        tenantId,
        role: 'ADMIN',
        scope: { branchId: branchAdmin.branch_id }
      }
    },
    {
      name: 'Team Leader',
      context: {
        userId: teamLeader.user_id,
        tenantId,
        role: 'TEAM_LEADER',
        scope: { branchId: teamLeader.branch_id, teamId: teamLeader.team_id }
      }
    },
    {
      name: 'Developer',
      context: {
        userId: developer.user_id,
        tenantId,
        role: 'DEVELOPER',
        scope: { branchId: developer.branch_id, teamId: developer.team_id }
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`\nTesting Role: ${tc.name}`);
    await requestContext.run(tc.context, async () => {
      // 1. Leads
      if (tc.role !== 'DEVELOPER') {
          const leads = await leadRepository.findAll(tenantId, {});
          console.log(`  - Leads Count: ${leads.rows.length}`);
      } else {
          console.log(`  - Leads (Developer should not call this directly, but if they did)`);
          const leads = await leadRepository.findAll(tenantId, {});
          console.log(`  - Leads Count: ${leads.rows.length}`);
      }
      
      // 2. Dashboard KPIs
      if (tc.role !== 'DEVELOPER') {
        const kpis = await dashboardRepository.getSummary(tenantId, {});
        console.log(`  - Dashboard KPIs Active Leads: ${kpis ? kpis.total_leads : 'N/A'}`);
      }
    });
  }

  console.log('\n--- Done ---');
  await pool.end();
}

runTests().catch(console.error);
