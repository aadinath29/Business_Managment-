const http = require('http');

const testApiWithDebug = async () => {
  try {
    console.log('Logging in as admin...');
    const loginData = JSON.stringify({ email: 'admin@antigravity.com', password: 'Admin@123' });
    
    const makeRequest = (options, body = null) => {
      return new Promise((resolve) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, data });
            }
          });
        });
        req.on('error', err => resolve({ error: err.message }));
        if (body) req.write(body);
        req.end();
      });
    };

    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, loginData);

    if (!loginRes.data?.data?.accessToken) {
      console.error('Login failed:', loginRes);
      return;
    }

    const token = loginRes.data.data.accessToken;
    const user = loginRes.data.data.user;
    console.log('Login successful. User role:', user.role, '| Token:', token.substring(0, 30) + '...');

    // GET /api/v1/teams
    const teamsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/teams',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\nGET /api/v1/teams:');
    console.log('Status:', teamsRes.status);
    console.log('Total:', teamsRes.data?.pagination?.total);
    console.log('Data length:', teamsRes.data?.data?.length);
    
    // GET /api/v1/team-leaders
    const leadersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/team-leaders?limit=100',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\nGET /api/v1/team-leaders:');
    console.log('Status:', leadersRes.status);
    console.log('Total:', leadersRes.data?.pagination?.total);
    console.log('Data length:', leadersRes.data?.data?.length);
    if (leadersRes.data?.data?.length > 0) {
      console.log('First leader:', JSON.stringify(leadersRes.data.data[0], null, 2));
    }
    
  } catch (error) {
    console.error(error);
  }
};

testApiWithDebug();
