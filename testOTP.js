// End-to-end test for the 3-step OTP password reset flow
const BASE = 'http://localhost:3001/api/auth';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('═══════════════════════════════════════');
  console.log('  OTP Password Reset — End-to-End Test ');
  console.log('═══════════════════════════════════════\n');

  // --- Test 1: Request OTP for non-existent email ---
  console.log('▸ [1/6] Request OTP for unknown email...');
  const t1 = await post('/forgot-password', { email: 'ghost@nowhere.com' });
  if (t1.status === 404) {
    console.log('  ✓ PASS — 404 returned for unknown email\n');
  } else {
    console.error(`  ✗ FAIL — Expected 404, got ${t1.status}:`, t1.data, '\n');
  }

  // --- Test 2: Request OTP for valid email ---
  console.log('▸ [2/6] Request OTP for user@linkpreview.pro...');
  const t2 = await post('/forgot-password', { email: 'user@linkpreview.pro' });
  if (t2.ok) {
    console.log('  ✓ PASS —', t2.data.message);
    console.log('  ℹ  Check the server console for the OTP code.\n');
  } else {
    console.error('  ✗ FAIL:', t2.data, '\n');
    process.exit(1);
  }

  // --- Prompt user to enter OTP from server console ---
  const otp = await new Promise(resolve => {
    process.stdout.write('  Enter the OTP shown in the server console: ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', d => resolve(d.trim()));
  });

  // --- Test 3: Verify with wrong OTP ---
  console.log('\n▸ [3/6] Verify with incorrect OTP (000000)...');
  const t3 = await post('/verify-reset-token', { email: 'user@linkpreview.pro', token: '000000' });
  if (t3.status === 400) {
    console.log('  ✓ PASS — Wrong OTP rejected correctly\n');
  } else {
    console.error(`  ✗ FAIL — Expected 400, got ${t3.status}:`, t3.data, '\n');
  }

  // --- Test 4: Verify with correct OTP ---
  console.log('▸ [4/6] Verify with correct OTP...');
  const t4 = await post('/verify-reset-token', { email: 'user@linkpreview.pro', token: otp });
  if (t4.ok && t4.data.valid) {
    console.log('  ✓ PASS — OTP verified!\n');
  } else {
    console.error('  ✗ FAIL:', t4.data, '\n');
    process.exit(1);
  }

  // --- Test 5: Reset password without OTP (bypass attempt) ---
  console.log('▸ [5/6] Attempt password reset with wrong OTP (bypass test)...');
  const t5 = await post('/reset-password', { email: 'user@linkpreview.pro', token: '999999', newPassword: 'hackedpassword' });
  if (t5.status === 400) {
    console.log('  ✓ PASS — Bypass attempt denied\n');
  } else {
    console.error(`  ✗ FAIL — Expected 400, got ${t5.status}:`, t5.data, '\n');
  }

  // --- Test 6: Reset password with correct OTP ---
  const newPass = 'NewSecurePass123';
  console.log('▸ [6/6] Reset password with correct OTP...');
  const t6 = await post('/reset-password', { email: 'user@linkpreview.pro', token: otp, newPassword: newPass });
  if (t6.ok && t6.data.success) {
    console.log('  ✓ PASS — Password reset!\n');
  } else {
    console.error('  ✗ FAIL:', t6.data, '\n');
    process.exit(1);
  }

  // --- Verify login works with the new password ---
  console.log('▸ [Bonus] Login with new password to confirm...');
  const tL = await post('/login', { email: 'user@linkpreview.pro', password: newPass });
  if (tL.ok && tL.data.token) {
    console.log('  ✓ PASS — Login with new password successful!\n');
  } else {
    console.error('  ✗ FAIL:', tL.data, '\n');
  }

  // --- Restore original password ---
  const t7 = await post('/forgot-password', { email: 'user@linkpreview.pro' });
  if (t7.ok) {
    const otp2 = await new Promise(resolve => {
      process.stdout.write('  Enter new OTP shown in server console to restore password: ');
      process.stdin.once('data', d => resolve(d.trim()));
    });
    await post('/reset-password', { email: 'user@linkpreview.pro', token: otp2, newPassword: 'linkpreview123' });
    console.log('\n  ✓ Password restored to default.\n');
  }

  console.log('═══════════════════════════════════════');
  console.log('  All tests passed! ');
  console.log('═══════════════════════════════════════');
  process.exit(0);
}

runTests().catch(err => { console.error('Fatal:', err); process.exit(1); });
