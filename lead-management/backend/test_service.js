require('dotenv').config();
const aiService = require('./src/ai/ai.service');
const db = require('./src/database');

const runTest = async () => {
  try {
    console.log('Testing searchLeads...');
    const leads = await aiService.searchLeads('medium', null);
    console.log('Leads found:', leads);
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    if (db && db.pool) await db.pool.end();
  }
};

runTest();
