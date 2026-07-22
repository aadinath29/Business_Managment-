require('dotenv').config();
const { Pool } = require('pg');
const jwtHelper = require('./src/auth/utils/jwtHelper');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Admin@123',
  database: 'Business'
});

async function test() {
  try {
    const res = await pool.query('SELECT * FROM users WHERE email = \'alise@gmail.com\'');
    const user = res.rows[0];
    
    const token = jwtHelper.generateAccessToken({
      user_id: user.id,
      tenant_id: user.tenant_id,
      role: 'ADMIN',
      session_id: 'test'
    });

    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/branches',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }, (bRes) => {
      let bBody = '';
      bRes.on('data', chunk => bBody += chunk);
      bRes.on('end', () => {
        console.log('Branches Response:', bBody);
        process.exit(0);
      });
    });
    req.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
