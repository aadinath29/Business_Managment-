require('dotenv').config();
const { pool } = require('./src/database');
const request = require('supertest');
const app = require('./src/app');
const jwt = require('jsonwebtoken');

async function testApi() {
  try {
    const tenantId = 'aaaa0000-0000-0000-0000-000000000000';
    const userId = 'bbbb0000-0000-0000-0000-000000000001';
    
    // Create token
    const token = jwt.sign({
      user_id: userId,
      tenant_id: tenantId,
      role: 'SUPER_ADMIN'
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });

    // Test GET /teams
    const res = await request(app)
      .get('/api/v1/teams?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
      
    console.log("Teams Response Status:", res.status);
    console.log("Teams Data Length:", res.body.data ? res.body.data.length : res.body);
    
    // Test GET /teams/stats
    const statsRes = await request(app)
      .get('/api/v1/teams/stats')
      .set('Authorization', `Bearer ${token}`);
      
    console.log("Stats Response Status:", statsRes.status);
    console.log("Stats Data:", statsRes.body.data);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

testApi();
