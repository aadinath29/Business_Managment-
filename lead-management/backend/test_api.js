const http = require('http');

const testApi = async () => {
  try {
    console.log('Logging in as admin...');
    const loginData = JSON.stringify({ email: 'admin@antigravity.com', password: 'Admin@123' });
    
    const loginReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        if (!response.data || !response.data.accessToken) {
          console.error('Login failed:', response);
          return;
        }
        const token = response.data.accessToken;
        console.log('Login successful. Testing GET /api/v1/teams...');
        
        http.get('http://localhost:5000/api/v1/teams', {
          headers: { 'Authorization': `Bearer ${token}` }
        }, (res2) => {
          let data2 = '';
          res2.on('data', chunk => data2 += chunk);
          res2.on('end', () => {
            const teamsResponse = JSON.parse(data2);
            console.log('Teams API Response:');
            console.log(JSON.stringify(teamsResponse, null, 2));
            if (teamsResponse.success) {
              console.log('SUCCESS: API and Backend connected properly. Data is valid.');
            } else {
              console.log('FAILED: API returned success=false');
            }
          });
        }).on('error', err => console.error('Teams request error:', err));
      });
    });
    
    loginReq.on('error', err => {
      console.error('Login request error. Is server running?', err.message);
    });
    loginReq.write(loginData);
    loginReq.end();
  } catch (error) {
    console.error(error);
  }
};

testApi();
