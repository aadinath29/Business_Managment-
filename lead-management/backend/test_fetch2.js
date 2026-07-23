async function run() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'harsh@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    
    const res = await fetch('http://localhost:5000/api/v1/branches', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Success:', res.status, data.data.map(b => b.branch_name));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
