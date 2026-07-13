require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: '11111111-1111-1111-1111-111111111111', role: 'SUPER_ADMIN', tenantId: '708170c2-ce62-42da-aaec-a6cb9e943486' },
  process.env.JWT_SECRET || 'super_secret_access_token_lead_management_crm_2026'
);

async function testApi() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/team-leaders?limit=100', {
      headers: {
        'Cookie': 'refreshToken=dummy' // just for some auth if needed
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data.data?.length || data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
testApi();
