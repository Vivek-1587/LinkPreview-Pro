

async function test() {
  console.log('Testing Registration...');
  const regRes = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' })
  });
  
  if (!regRes.ok && regRes.status !== 400) {
    console.error('Registration failed:', await regRes.text());
  } else {
    console.log('Registration OK or already exists.');
  }

  console.log('Testing Login...');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
  });

  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  const data = await loginRes.json();
  console.log('Login successful. Token:', data.token);

  console.log('Testing Protected Route (me)...');
  const meRes = await fetch('http://localhost:3001/api/auth/me', {
    headers: { 'Authorization': `Bearer ${data.token}` }
  });

  if (!meRes.ok) {
    console.error('Protected route failed:', await meRes.text());
  } else {
    const meData = await meRes.json();
    console.log('Protected route successful. User:', meData.email);
  }
}

test();
