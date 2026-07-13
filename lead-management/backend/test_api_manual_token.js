require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function checkTeams() {
  try {
    const tenantId = 'aaaa0000-0000-0000-0000-000000000000';
    const userId = 'bbbb0000-0000-0000-0000-000000000001';
    
    // Create token
    const token = jwt.sign({
      user_id: userId,
      tenant_id: tenantId,
      role: 'SUPER_ADMIN'
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });

    console.log("Fetching /teams");
    const teamsRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/v1/teams?page=1&limit=10', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Teams status:", teamsRes.status);
    console.log("Teams Error:", teamsRes.data.error);
    console.log("Teams data length:", teamsRes.data.data ? teamsRes.data.data.length : null);
    
    console.log("Fetching /teams/stats");
    const statsRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/v1/teams/stats', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Stats status:", statsRes.status);
    console.log("Stats Error:", statsRes.data.error);
    console.log("Stats data:", statsRes.data.data);

  } catch (error) {
    console.error("API Error:", error);
  }
}

checkTeams();
