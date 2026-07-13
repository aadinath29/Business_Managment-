require('dotenv').config();
const teamService = require('./src/teams/services/teamService');
const { pool } = require('./src/database');
const requestContext = require('./src/utils/requestContext');

async function testServices() {
  try {
    const tenantId = 'aaaa0000-0000-0000-0000-000000000000';
    const userRole = 'SUPER_ADMIN';
    const userId = '11111111-1111-1111-1111-111111111111';

    const mockUser = {
      user_id: userId,
      tenant_id: tenantId,
      role: userRole,
      scope: { branchId: null, teamId: null }
    };

    requestContext.run(mockUser, async () => {
      try {
        const filters = { page: 1, limit: 10 };
        const teams = await teamService.getTeams(tenantId, userRole, userId, filters);
        console.log("Teams Data:", JSON.stringify(teams, null, 2));
      } catch (e) {
        console.error(e);
      } finally {
        pool.end();
      }
    });

  } catch (error) {
    console.error("Service error:", error);
    pool.end();
  }
}

testServices();
