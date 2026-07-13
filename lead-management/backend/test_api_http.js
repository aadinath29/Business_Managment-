const http = require('http');

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
    const loginData = JSON.stringify({ email: 'admin@antigravity.com', password: 'password123' });
    const loginRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/v1/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, loginData);
    
    if (loginRes.status !== 200) {
      console.error("Login failed", loginRes.data);
      return;
    }
    
    const token = loginRes.data.data.token;
    
    const teamsRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/v1/teams', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Teams status:", teamsRes.status);
    console.log("Teams data:", teamsRes.data);
    
    const statsRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/v1/teams/stats', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Stats status:", statsRes.status);
    console.log("Stats data:", statsRes.data);

  } catch (error) {
    console.error("API Error:", error);
  }
}

checkTeams();
