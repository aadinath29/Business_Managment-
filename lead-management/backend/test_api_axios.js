const axios = require('axios');

async function checkTeams() {
  try {
    const res = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@kosqu.com',
      password: 'password123'
    });
    
    const token = res.data.data.token;
    
    console.log("Fetching /teams");
    const teamsRes = await axios.get('http://localhost:5000/api/v1/teams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Teams length:", teamsRes.data.data.length);
    
    console.log("Fetching /teams/stats");
    const statsRes = await axios.get('http://localhost:5000/api/v1/teams/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Stats:", statsRes.data.data);

  } catch (error) {
    console.error("API Error:", error.response ? error.response.data : error.message);
  }
}

checkTeams();
