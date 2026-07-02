import fetch from 'node-fetch';

async function testRegisterDuplicate() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin', role: 'admin' })
    });
    
    console.log('Register Duplicate Status:', res.status);
    const data = await res.json();
    console.log('Register Duplicate Data:', data);
  } catch (err) {
    console.error('Register Duplicate Error:', err);
  }
}

testRegisterDuplicate();
