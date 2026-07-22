const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
let testResults = [];

const logResult = (testName, passed, details) => {
  testResults.push({ testName, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}`);
  if (!passed) console.log(`   -> ${details}`);
};

const makeRequest = async (method, endpoint, body = null, headers = {}) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => null);
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
};

const runTests = async () => {
  console.log('Starting Dynamic API Tests...\n');

  // 1. Health Check
  const healthRes = await makeRequest('GET', '/health');
  if (healthRes.status === 200 && healthRes.data.status === 'UP') {
    logResult('Health Check Endpoint', true, 'Server is UP');
  } else {
    logResult('Health Check Endpoint', false, `Expected 200 UP, got ${healthRes.status}`);
  }

  // 2. Auth - Login Missing Fields
  const loginRes1 = await makeRequest('POST', '/api/v1/auth/login', { email: 'test@example.com' });
  if (loginRes1.status === 400 || loginRes1.status === 422) {
    logResult('Auth Login (Missing Fields)', true, `Correctly rejected with ${loginRes1.status}`);
  } else {
    logResult('Auth Login (Missing Fields)', false, `Expected 400/422, got ${loginRes1.status}. Body: ${JSON.stringify(loginRes1.data)}`);
  }

  // 3. Auth - SQL Injection Attempt
  const loginRes2 = await makeRequest('POST', '/api/v1/auth/login', { email: "' OR '1'='1", password: 'password' });
  if (loginRes2.status >= 400 && loginRes2.status !== 500) {
    logResult('Auth Login (SQLi Attempt)', true, `Rejected gracefully with ${loginRes2.status}`);
  } else {
    logResult('Auth Login (SQLi Attempt)', false, `SQLi unhandled or 500 Server Error! Status: ${loginRes2.status}`);
  }

  // 4. Protected Route - Leads without Token
  const leadsRes1 = await makeRequest('GET', '/api/v1/leads');
  if (leadsRes1.status === 401 || leadsRes1.status === 403) {
    logResult('Protected Route /leads (No Auth)', true, `Blocked with ${leadsRes1.status}`);
  } else {
    logResult('Protected Route /leads (No Auth)', false, `Leaked data or failed to block properly! Status: ${leadsRes1.status}`);
  }

  // 5. Invalid Route Handling
  const notFoundRes = await makeRequest('GET', '/api/v1/this-route-does-not-exist');
  if (notFoundRes.status === 404) {
    logResult('404 Handling', true, 'Returned 404 for invalid route');
  } else {
    logResult('404 Handling', false, `Expected 404, got ${notFoundRes.status}`);
  }
  
  // Generating Report
  console.log('\n--- Tests Complete ---');
};

runTests();
