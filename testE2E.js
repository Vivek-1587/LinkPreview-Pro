// Full end-to-end test: reads OTP directly from SQLite DB to complete the full reset cycle
// Run with: node testE2E.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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

const TEST_EMAIL    = 'user@linkpreview.pro';
const ORIG_PASS     = 'linkpreview123';
const NEW_PASS      = 'NewSecurePass_E2E_2026';

let passed = 0;
let failed = 0;
const pass = (msg)       => { console.log(`  ✓ PASS — ${msg}`); passed++; };
const fail = (msg, detail) => { console.error(`  ✗ FAIL — ${msg}`, detail || ''); failed++; };

async function run() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   Forgot Password — Full E2E Test (DB-Assisted OTP)  ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // ── 1. Reject unknown email ──────────────────────────────────────────────────
  console.log('▸ [1] Unknown email → 404');
  const t1 = await post('/forgot-password', { email: 'nobody@ghost.io' });
  t1.status === 404 ? pass('404 returned for unknown email') : fail(`Expected 404, got ${t1.status}`, t1.data);

  // ── 2. Request OTP for valid account ─────────────────────────────────────────
  console.log('▸ [2] Request OTP for valid account');
  const t2 = await post('/forgot-password', { email: TEST_EMAIL });
  t2.ok ? pass(t2.data.message) : fail('OTP request failed', t2.data);
  if (!t2.ok) { await prisma.$disconnect(); process.exit(1); }

  // ── 3. Read OTP directly from database ───────────────────────────────────────
  console.log('▸ [3] Reading OTP from database...');
  const record = await prisma.resetToken.findUnique({ where: { email: TEST_EMAIL } });
  if (!record) { fail('No reset token found in DB'); await prisma.$disconnect(); process.exit(1); }
  const otp = record.token;
  pass(`OTP retrieved from DB: ${otp} (expires: ${record.expiresAt.toISOString()})`);

  // ── 4. Reject wrong OTP ───────────────────────────────────────────────────────
  console.log('▸ [4] Wrong OTP → rejected');
  const t4 = await post('/verify-reset-token', { email: TEST_EMAIL, token: '000000' });
  t4.status === 400 ? pass('Wrong OTP rejected') : fail(`Expected 400, got ${t4.status}`, t4.data);

  // ── 5. Verify correct OTP ─────────────────────────────────────────────────────
  console.log('▸ [5] Correct OTP → verified');
  const t5 = await post('/verify-reset-token', { email: TEST_EMAIL, token: otp });
  t5.ok && t5.data.valid ? pass('OTP verified') : fail('OTP verification failed', t5.data);

  // ── 6. Bypass attempt: reset with wrong OTP ───────────────────────────────────
  console.log('▸ [6] Bypass attempt (wrong OTP on reset-password) → denied');
  const t6 = await post('/reset-password', { email: TEST_EMAIL, token: '999999', newPassword: NEW_PASS });
  t6.status === 400 ? pass('Bypass denied') : fail(`Expected 400, got ${t6.status}`, t6.data);

  // ── 7. Reset password with correct OTP ───────────────────────────────────────
  console.log('▸ [7] Reset password with correct OTP');
  const t7 = await post('/reset-password', { email: TEST_EMAIL, token: otp, newPassword: NEW_PASS });
  t7.ok && t7.data.success ? pass('Password reset successfully') : fail('Password reset failed', t7.data);
  if (!t7.ok) { await prisma.$disconnect(); process.exit(1); }

  // ── 8. OTP deleted after use (cannot reuse) ───────────────────────────────────
  console.log('▸ [8] Confirm OTP cannot be reused after reset');
  const t8 = await post('/reset-password', { email: TEST_EMAIL, token: otp, newPassword: 'HackAttempt' });
  t8.status === 400 ? pass('OTP correctly invalidated after use') : fail(`Expected 400, got ${t8.status}`, t8.data);

  // ── 9. Login with NEW password ────────────────────────────────────────────────
  console.log('▸ [9] Login with new password');
  const t9 = await post('/login', { email: TEST_EMAIL, password: NEW_PASS });
  t9.ok && t9.data.token ? pass('Login with new password ✓') : fail('Login with new password failed', t9.data);

  // ── 10. Login with OLD password must fail ─────────────────────────────────────
  console.log('▸ [10] Login with OLD password → rejected');
  const t10 = await post('/login', { email: TEST_EMAIL, password: ORIG_PASS });
  t10.status === 401 ? pass('Old password correctly rejected') : fail(`Expected 401, got ${t10.status}`, t10.data);

  // ── 11. Restore original password ────────────────────────────────────────────
  console.log('▸ [11] Restoring original password...');
  const restore1 = await post('/forgot-password', { email: TEST_EMAIL });
  if (restore1.ok) {
    const restoreRecord = await prisma.resetToken.findUnique({ where: { email: TEST_EMAIL } });
    if (restoreRecord) {
      const r = await post('/reset-password', {
        email: TEST_EMAIL,
        token: restoreRecord.token,
        newPassword: ORIG_PASS,
      });
      r.ok ? pass('Original password restored') : fail('Failed to restore original password', r.data);
    } else {
      fail('No restore token in DB');
    }
  } else {
    fail('Failed to request restore OTP', restore1.data);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║  Results: ${String(passed).padEnd(2)} passed, ${String(failed).padEnd(2)} failed                       ║`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error('Fatal test error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
