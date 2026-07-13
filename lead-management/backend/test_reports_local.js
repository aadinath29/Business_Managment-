require('dotenv').config({ path: 'C:/Users/DELL/Desktop/buisness management/lead-management/backend/.env' });
const { getBranchSnapshot } = require('C:/Users/DELL/Desktop/buisness management/lead-management/backend/src/modules/reports/services/reportsService');
const db = require('C:/Users/DELL/Desktop/buisness management/lead-management/backend/src/database');

async function run() {
  try {
    const res = await db.query(`SELECT id FROM tenants LIMIT 1`);
    if (res.rows.length === 0) {
      console.log('No tenants found.');
      process.exit(0);
    }
    const tenantId = res.rows[0].id;
    console.log('Testing getBranchSnapshot with tenantId:', tenantId);
    
    const result = await getBranchSnapshot(tenantId);
    console.log('Success! Result row count:', result.length);
    if (result.length > 0) {
      console.log('Sample row:', result[0]);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error running report query:', err);
    process.exit(1);
  }
}

run();
