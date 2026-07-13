require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 'bbbb0000-0000-0000-0000-000000000001', role: 'SUPER_ADMIN', tenantId: 'aaaa0000-0000-0000-0000-000000000000' },
  process.env.JWT_SECRET || 'super_secret_access_token_lead_management_crm_2026'
);

async function testApi() {
  try {
    const res1 = await fetch('http://localhost:5000/api/v1/teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Teams Status:", res1.status);
    console.log("Teams Data:", await res1.json());

    const res2 = await fetch('http://localhost:5000/api/v1/team-leaders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Team Leaders Status:", res2.status);
    console.log("Team Leaders Data:", await res2.json());
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
testApi();
