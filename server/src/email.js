// server/src/email.js - Multi-Provider Email Service
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

// Load environment variables dynamically in Node.js
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (err) {
  // .env might not exist yet during local setup, which is fine
}

/**
 * Reads and parsed active email configuration from environment variables.
 */
export function getEmailConfig() {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  // Clean up standard SMTP_FROM format
  let smtpFrom = process.env.SMTP_FROM;
  if (!smtpFrom && smtpUser) {
    smtpFrom = `"LinkPreview Pro" <${smtpUser}>`;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;

  // Auto-detect provider if not explicitly defined
  let activeProvider = provider;
  if (!activeProvider) {
    if (resendKey) activeProvider = 'resend';
    else if (sendgridKey) activeProvider = 'sendgrid';
    else if (smtpHost && smtpUser && smtpPass) activeProvider = 'smtp';
    else activeProvider = 'none';
  }

  return {
    provider: activeProvider,
    smtp: {
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom || '"LinkPreview Pro" <noreply@linkpreview.pro>',
    },
    resend: {
      apiKey: resendKey,
      from: smtpFrom || 'onboarding@resend.dev',
    },
    sendgrid: {
      apiKey: sendgridKey,
      from: smtpFrom || 'noreply@linkpreview.pro',
    },
  };
}

/**
 * Validates the email configuration and prints diagnostics to the console.
 */
export function validateEmailConfig(logOnSuccess = false) {
  const config = getEmailConfig();
  const isProd = process.env.NODE_ENV === 'production';
  const missing = [];

  if (config.provider === 'smtp') {
    if (!config.smtp.host) missing.push('SMTP_HOST');
    if (!config.smtp.user) missing.push('SMTP_USER');
    if (!config.smtp.pass) missing.push('SMTP_PASS');
  } else if (config.provider === 'resend') {
    if (!config.resend.apiKey) missing.push('RESEND_API_KEY');
  } else if (config.provider === 'sendgrid') {
    if (!config.sendgrid.apiKey) missing.push('SENDGRID_API_KEY');
  } else {
    missing.push('SMTP_HOST/RESEND_API_KEY/SENDGRID_API_KEY');
  }

  if (missing.length > 0 || config.provider === 'none') {
    const providerStr = config.provider && config.provider !== 'none' ? config.provider.toUpperCase() : 'NONE CONFIGURED';
    console.warn('\n┌────────────────────────────────────────────────────────┐');
    console.warn(`│ WARNING: Email Service is not fully configured!         │`);
    console.warn(`│                                                        │`);
    console.warn(`│ Provider: ${providerStr.padEnd(45)}│`);
    console.warn(`│ Missing variables: ${missing.join(', ').padEnd(36)}│`);
    console.warn(`│                                                        │`);
    if (isProd) {
      console.warn(`│ CRITICAL: Forgot Password flow will FAIL in production! │`);
    } else {
      console.warn(`│ Forgot Password flow will run in mock/console mode.    │`);
    }
    console.warn('└────────────────────────────────────────────────────────┘\n');
    return { valid: false, missing, provider: config.provider };
  }

  if (logOnSuccess) {
    console.log(`[Email Service] Configured successfully using provider: ${config.provider.toUpperCase()}`);
  }
  return { valid: true, missing: [], provider: config.provider };
}

/**
 * Sends a password reset OTP email.
 * Falls back to console logging if SMTP settings are not configured and NOT in production.
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
export async function sendOtpEmail(to, otp) {
  const emailLower = to.toLowerCase().trim();
  const config = getEmailConfig();
  const isProd = process.env.NODE_ENV === 'production';
  const validation = validateEmailConfig(false);

  console.log(`[Email Service] Attempting to send OTP email to: ${emailLower} using provider: ${config.provider.toUpperCase()}`);

  // If validation fails
  if (!validation.valid) {
    if (isProd) {
      console.error(`[Email Service] [FATAL] Cannot send email in production mode: missing variables ${validation.missing.join(', ')}`);
      throw new Error(`Email delivery failed: Server email configuration is missing or incomplete.`);
    } else {
      // In development, fall back to console logging
      console.log('\n===============================================================');
      console.log(`[Email Service] (MOCK/CONSOLE) SMTP/API not fully configured in .env.`);
      console.log(`[Email Service] OTP for ${emailLower}: ${otp} (expires in 15 min)`);
      console.log('===============================================================\n');
      return { mock: true, message: 'OTP logged to console (SMTP/API not configured)' };
    }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset OTP</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #121214; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.40);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 32px 32px 16px 32px;">
                  <div style="display: inline-block; height: 48px; width: 48px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #9333ea); text-align: center; line-height: 48px; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);">
                    <span style="color: #ffffff; font-size: 24px; font-weight: bold; font-family: sans-serif;">&infin;</span>
                  </div>
                  <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 16px 0 4px 0; letter-spacing: -0.025em;">
                    LinkPreview<span style="color: #3b82f6;">Pro</span>
                  </h2>
                  <p style="color: #a1a1aa; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500;">
                    Developer Metadata Extraction Console
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 16px 32px; text-align: center;">
                  <div style="height: 1px; background-color: #27272a; margin-bottom: 24px;"></div>
                  
                  <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Reset Your Password</h3>
                  <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0 0 24px 0;">
                    We received a request to reset your password. Use the verification code below to complete the reset process.
                  </p>
                  
                  <!-- OTP Code Display -->
                  <div style="display: inline-block; background-color: #09090b; border: 1px solid #3f3f46; border-radius: 12px; padding: 14px 28px; margin: 8px 0 24px 0; letter-spacing: 6px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; color: #3b82f6; text-shadow: 0 0 10px rgba(59, 130, 246, 0.3); padding-left: 6px;">${otp}</span>
                  </div>

                  <p style="color: #ef4444; font-size: 11px; font-weight: 500; margin: 0 0 24px 0;">
                    This code is valid for 15 minutes.
                  </p>
                  
                  <div style="height: 1px; background-color: #27272a; margin-top: 8px; margin-bottom: 24px;"></div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 0 32px 32px 32px; text-align: center;">
                  <p style="color: #71717a; font-size: 11px; line-height: 1.4; margin: 0;">
                    If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `Your LinkPreview Pro verification code is: ${otp}. This code is valid for 15 minutes.`;

  try {
    if (config.provider === 'smtp') {
      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });

      const mailOptions = {
        from: config.smtp.from,
        to: emailLower,
        subject: 'Verification Code - LinkPreview Pro Password Reset',
        text: textContent,
        html: htmlContent,
      };

      console.log(`[Email Service] Sending via SMTP host: ${config.smtp.host}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Service] SMTP success! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };

    } else if (config.provider === 'resend') {
      console.log(`[Email Service] Sending via Resend API...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resend.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.resend.from,
          to: emailLower,
          subject: 'Verification Code - LinkPreview Pro Password Reset',
          text: textContent,
          html: htmlContent,
        }),
      });

      const data = await response.json().catch(() => ({}));
      console.log(`[Email Service] Resend API Response Status: ${response.status}`, data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status} ${response.statusText}`);
      }

      return { success: true, id: data.id };

    } else if (config.provider === 'sendgrid') {
      console.log(`[Email Service] Sending via SendGrid API...`);
      
      // SendGrid expects email address formatted without display names or separate
      let fromEmail = config.sendgrid.from;
      if (fromEmail.includes('<')) {
        fromEmail = fromEmail.split('<')[1].replace('>', '').trim();
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.sendgrid.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: emailLower }] }],
          from: { email: fromEmail, name: 'LinkPreview Pro' },
          subject: 'Verification Code - LinkPreview Pro Password Reset',
          content: [
            { type: 'text/plain', value: textContent },
            { type: 'text/html', value: htmlContent }
          ],
        }),
      });

      if (!response.ok) {
        const responseData = await response.text();
        console.error(`[Email Service] SendGrid API failed. Status: ${response.status}`, responseData);
        throw new Error(`SendGrid API Error: ${response.status} - ${responseData}`);
      }

      console.log(`[Email Service] SendGrid success!`);
      return { success: true };
    } else {
      throw new Error(`Unsupported email provider: ${config.provider}`);
    }
  } catch (err) {
    console.error(`[Email Service] Error sending email via ${config.provider.toUpperCase()}:`, err);
    throw new Error(`Email delivery failed via ${config.provider.toUpperCase()}: ${err.message}`);
  }
}
