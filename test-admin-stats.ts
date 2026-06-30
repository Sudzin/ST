import fetch from 'node-fetch';

async function testAdminStats() {
  try {
    console.log('Fetching admin stats...');
    const res = await fetch('http://localhost:3000/api/admin/stats');
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Data:', data);
    } else {
      console.log('Error:', await res.text());
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testAdminStats();
