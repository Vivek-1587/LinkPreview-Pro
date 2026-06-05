// server/src/routes/auth.js - Authentication routes
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../db.js';
import { signToken, requireAuth } from '../auth.js';
import { sendOtpEmail } from '../email.js';

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailLower }
    });

    if (existing) {
      console.warn(`[Auth] Failed registration - Email already exists: ${emailLower}`);
      return res.status(400).json({ error: 'Email address already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user record
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailLower,
        password: hashedPassword
      }
    });

    // Generate JWT token
    const token = signToken({ id: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    next(err);
  }
});

// POST /api/auth/login - Authenticate credentials and return JWT
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      console.warn(`[Auth] Failed login - User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Failed login - Incorrect password for user: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    next(err);
  }
});

// GET /api/auth/me - Fetch authenticated user profiles
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password - Generate a 6-digit OTP and store it in ResetToken
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();
    console.log(`[Auth] Password reset requested for: ${emailLower}`);

    const user = await prisma.user.findUnique({
      where: { email: emailLower }
    });

    if (!user) {
      console.warn(`[Auth] Forgot password - No account found for: ${emailLower}`);
      return res.status(404).json({ error: 'No account found with that email address.' });
    }

    // Generate a cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Upsert: replace any existing token for this email
    await prisma.resetToken.upsert({
      where: { email: emailLower },
      create: { email: emailLower, token: otp, expiresAt },
      update: { token: otp, expiresAt }
    });

    console.log(`[Auth] OTP generated for: ${emailLower} (expires: ${expiresAt.toISOString()})`);

    // Send OTP email — must succeed before returning 200
    // In development without credentials, sendOtpEmail logs to console and returns mock.
    // In production without credentials, sendOtpEmail throws, which causes 500 below.
    let emailResult;
    try {
      emailResult = await sendOtpEmail(emailLower, otp);
    } catch (mailErr) {
      console.error('[Auth] Email delivery failed for OTP:', mailErr.message);
      return res.status(500).json({
        error: 'Failed to send OTP email. Please verify email provider credentials in your .env file.',
        detail: mailErr.message
      });
    }

    if (emailResult?.mock) {
      // Development mock mode - OTP was printed to console
      console.log(`[Auth] [DEV MODE] OTP delivery mocked — check server console for the code.`);
    } else {
      console.log(`[Auth] OTP email delivered successfully to: ${emailLower}`);
    }

    res.json({ message: 'A 6-digit OTP has been sent to your email address.' });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    next(err);
  }
});

// POST /api/auth/verify-reset-token - Validate the OTP against the database
router.post('/verify-reset-token', async (req, res, next) => {
  try {
    const { email, token } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!token) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const tokenStr = String(token).trim();

    console.log(`[Auth] OTP verification attempt for: ${emailLower}`);

    const resetRecord = await prisma.resetToken.findUnique({
      where: { email: emailLower }
    });

    if (!resetRecord) {
      console.warn(`[Auth] Verify OTP - No token record found for: ${emailLower}`);
      return res.status(400).json({ error: 'No OTP was requested for this email address.' });
    }

    if (new Date() > resetRecord.expiresAt) {
      // Clean up expired token
      await prisma.resetToken.delete({ where: { email: emailLower } });
      console.warn(`[Auth] Verify OTP - Expired token for: ${emailLower}`);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Use timing-safe comparison to prevent timing attacks
    const inputBuf = Buffer.from(tokenStr.padEnd(6, '\0'));
    const storedBuf = Buffer.from(resetRecord.token.padEnd(6, '\0'));
    const isMatch = inputBuf.length === storedBuf.length &&
      crypto.timingSafeEqual(inputBuf, storedBuf);

    if (!isMatch) {
      console.warn(`[Auth] Verify OTP - Incorrect OTP attempt for: ${emailLower}`);
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    console.log(`[Auth] OTP verified successfully for: ${emailLower}`);
    res.json({ valid: true, message: 'OTP verified successfully.' });
  } catch (err) {
    console.error('[Auth] Verify OTP error:', err);
    next(err);
  }
});

// POST /api/auth/reset-password - Verify OTP, update password, and clean up token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const tokenStr = String(token).trim();

    console.log(`[Auth] Password reset attempt for: ${emailLower}`);

    // Re-validate the OTP (critical security step - prevent bypassing verify step)
    const resetRecord = await prisma.resetToken.findUnique({
      where: { email: emailLower }
    });

    if (!resetRecord) {
      console.warn(`[Auth] Reset password - No active reset request for: ${emailLower}`);
      return res.status(400).json({ error: 'No active reset request found. Please start over.' });
    }

    if (new Date() > resetRecord.expiresAt) {
      await prisma.resetToken.delete({ where: { email: emailLower } });
      console.warn(`[Auth] Reset password - Expired token for: ${emailLower}`);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Timing-safe OTP comparison
    const inputBuf = Buffer.from(tokenStr.padEnd(6, '\0'));
    const storedBuf = Buffer.from(resetRecord.token.padEnd(6, '\0'));
    const isMatch = inputBuf.length === storedBuf.length &&
      crypto.timingSafeEqual(inputBuf, storedBuf);

    if (!isMatch) {
      console.warn(`[Auth] Reset password - Invalid OTP for: ${emailLower}`);
      return res.status(400).json({ error: 'Invalid OTP. Password reset denied.' });
    }

    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash and update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: emailLower },
      data: { password: hashedPassword }
    });

    // Delete the used token to prevent reuse
    await prisma.resetToken.delete({ where: { email: emailLower } });

    console.log(`[Auth] Password reset successfully for: ${emailLower}`);
    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    next(err);
  }
});

export default router;
