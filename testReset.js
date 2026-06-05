async function testReset() {
  console.log('Testing Forgot Password (Invalid Email)...');
  const res1 = await fetch('http://localhost:3001/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@example.com' })
  });
  if (res1.status === 404) {
    console.log('Success: Invalid email rejected correctly (404).');
  } else {
    console.error('Failed:', await res1.text());
  }

  console.log('\nTesting Forgot Password (Valid Email - user@linkpreview.pro)...');
  const res2 = await fetch('http://localhost:3001/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@linkpreview.pro' })
  });
  if (res2.ok) {
    console.log('Success: Valid email accepted.');
  } else {
    console.error('Failed:', await res2.text());
  }

  console.log('\nTesting Reset Password...');
  const res3 = await fetch('http://localhost:3001/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@linkpreview.pro', newPassword: 'newpassword123' })
  });
  if (res3.ok) {
    console.log('Success: Password updated.');
  } else {
    console.error('Failed:', await res3.text());
  }

  console.log('\nTesting Login with new password...');
  const res4 = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@linkpreview.pro', password: 'newpassword123' })
  });
  if (res4.ok) {
    console.log('Success: Logged in with new password!');
  } else {
    console.error('Failed:', await res4.text());
  }
}

testReset();
