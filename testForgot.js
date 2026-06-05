async function testForgot() {
  console.log('Testing Forgot Password...');
  const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com' })
  });
  
  if (!res.ok) {
    console.error('Failed:', await res.text());
  } else {
    console.log('Success:', await res.json());
  }
}

testForgot();
