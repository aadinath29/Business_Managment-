require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lead_management',
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT polname, polqual, polwithcheck 
    FROM pg_policy
  `);
  console.log("Policies:", res.rows);
  await client.end();
}

run().catch(console.error);
