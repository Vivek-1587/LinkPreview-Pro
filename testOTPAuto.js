// Automated OTP test (no stdin needed)
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

async function run() {
  let passed = 0, failed = 0;
  const pass = (msg) => { console.log(`  ✓ PASS — ${msg}`); passed++; };
  const fail = (msg, detail) => { console.error(`  ✗ FAIL — ${msg}`, detail || ''); failed++; };

  console.log('\n═══════════════════════════════════════════');
  console.log('   OTP Password Reset — Automated API Test');
  console.log('═══════════════════════════════════════════\n');

  // [1] Unknown email → 404
  console.log('▸ [1] Unknown email should be rejected...');
  const t1 = await post('/forgot-password', { email: 'ghost@nobody.io' });
  t1.status === 404 ? pass('404 for unknown email') : fail(`Expected 404, got ${t1.status}`, t1.data);

  // [2] Valid email → OTP generated and logged
  console.log('▸ [2] Valid email triggers OTP generation...');
  const t2 = await post('/forgot-password', { email: 'user@linkpreview.pro' });
  t2.ok ? pass(t2.data.message) : fail('OTP request failed', t2.data);

  // [3] Verify with wrong OTP → 400
  console.log('▸ [3] Wrong OTP should be rejected...');
  const t3 = await post('/verify-reset-token', { email: 'user@linkpreview.pro', token: '000000' });
  t3.status === 400 ? pass('Wrong OTP rejected') : fail(`Expected 400, got ${t3.status}`, t3.data);

  // [4] Reset password without correct OTP → 400
  console.log('▸ [4] Reset password with wrong OTP should be denied...');
  const t4 = await post('/reset-password', { email: 'user@linkpreview.pro', token: '000000', newPassword: 'hacked123' });
  t4.status === 400 ? pass('Bypass attempt denied') : fail(`Expected 400, got ${t4.status}`, t4.data);

  // [5] Missing fields → 400
  console.log('▸ [5] Missing fields should return 400...');
  const t5 = await post('/verify-reset-token', { email: 'user@linkpreview.pro' });
  t5.status === 400 ? pass('Missing OTP field rejected') : fail(`Expected 400, got ${t5.status}`, t5.data);

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`  ℹ  Check server console to see the actual OTP printed (for manual UI testing).`);
  console.log('═══════════════════════════════════════════\n');
}

run().catch(console.error);
