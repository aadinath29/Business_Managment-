require('dotenv').config();
const { pool } = require('./src/database');
const teamService = require('./src/teams/services/teamService');
const branchService = require('./src/branches/services/branchService');

async function testAllServices() {
  // Mock requestContext for scopeHelper
  const requestContext = require('./src/utils/requestContext');
  const user = {
    userId: 'bbbb0000-0000-0000-0000-000000000001',
    role: 'SUPER_ADMIN',
    scope: { branchId: null, teamId: null }
  };
  
  requestContext.run(user, async () => {
    try {
      const tenantId = 'aaaa0000-0000-0000-0000-000000000000';
      const userRole = 'SUPER_ADMIN';
      const userId = 'bbbb0000-0000-0000-0000-000000000001';

      const branches = await branchService.getBranches(tenantId, userRole, userId, { limit: 100 });
      console.log("getBranches returned:", branches.rows.length);

      console.log("Calling getTeamStats...");
      const res2 = await teamService.getTeamStats(tenantId, userRole, userId);
      console.log("getTeamStats:", res2);

      console.log("Calling getTeamLeaders without page...");
      const res = await teamService.getTeamLeaders(tenantId, userRole, userId, { limit: 100 });
      console.log("getTeamLeaders returned:", res.rows.length);
      console.log(JSON.stringify(res.rows, null, 2));

    } catch (error) {
      console.error("ERROR:", error);
    } finally {
      pool.end();
    }
  });
}

testAllServices();
