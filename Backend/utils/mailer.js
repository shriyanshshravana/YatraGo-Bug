const nodemailer = require('nodemailer');
const https = require('https');

/**
 * Get Brevo API key if configured
 * Strictly looks for keys starting with xkeysib-
 */
const getBrevoApiKey = () => {
  const envKey = (process.env.BREVO_API_KEY || '').trim();
  if (envKey && envKey.startsWith('xkeysib-')) return envKey;
  const pass = (process.env.EMAIL_PASS || '').trim();
  if (pass.startsWith('xkeysib-')) return pass;
  return null;
};

/**
 * Check if SMTP or API credentials are configured
 * @returns {boolean}
 */
const isEmailConfigured = () => {
  if (getBrevoApiKey()) {
    return true;
  }
  return Boolean(
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER.trim() !== '' &&
    process.env.EMAIL_PASS.trim() !== ''
  );
};

/**
 * Clean from address to prevent header formatting issues
 */
const cleanFromAddress = () => {
  let from = (process.env.EMAIL_FROM || '').trim();
  // Strip surrounding quotes if Render environment variable added them literally
  if (
    (from.startsWith('"') && from.endsWith('"') && !from.slice(1, -1).includes('"')) ||
    (from.startsWith("'") && from.endsWith("'"))
  ) {
    from = from.slice(1, -1).trim();
  }
  if (!from) {
    return `"YatraGo Support" <${process.env.EMAIL_USER || 'no-reply@yatrago.com'}>`;
  }
  return from;
};

/**
 * Extract sender name and email address
 */
const getSenderDetails = () => {
  const fromStr = cleanFromAddress();
  const emailMatch = fromStr.match(/<([^>]+)>/);
  if (emailMatch) {
    const email = emailMatch[1].trim();
    const name = fromStr.replace(/<[^>]+>/, '').replace(/["']/g, '').trim() || 'YatraGo';
    return { name, email };
  }
  const clean = fromStr.replace(/["']/g, '').trim();
  return {
    name: 'YatraGo',
    email: clean.includes('@') ? clean : (process.env.EMAIL_USER || 'no-reply@yatrago.com').trim(),
  };
};

/**
 * Send email via Brevo REST API (HTTPS port 443 - works everywhere including Render free tier)
 */
const sendViaBrevoApi = (apiKey, { toEmail, subject, html, text }) => {
  return new Promise((resolve, reject) => {
    const sender = getSenderDetails();
    const payload = JSON.stringify({
      sender: {
        name: sender.name,
        email: sender.email,
      },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html,
      textContent: text,
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      },
      timeout: 12000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, messageId: data });
        } else {
          try {
            const errObj = JSON.parse(data);
            reject(new Error(errObj.message || `Brevo API HTTP ${res.statusCode}`));
          } catch {
            reject(new Error(`Brevo API returned HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Brevo API request timed out (HTTPS port 443)'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Create and return Nodemailer transporter
 */
const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  let host = (process.env.EMAIL_HOST || '').trim();
  let port = Number(process.env.EMAIL_PORT) || 587;
  let secure = process.env.EMAIL_SECURE === 'true';

  // Smart detection: If EMAIL_USER has 'brevo' but EMAIL_HOST was omitted or left default on cloud host
  if (!host || host === 'smtp.gmail.com') {
    if (process.env.EMAIL_USER && process.env.EMAIL_USER.toLowerCase().includes('brevo')) {
      host = 'smtp-relay.brevo.com';
      port = 587;
      secure = false;
    } else {
      host = host || 'smtp.gmail.com';
    }
  }

  if (port === 465) {
    secure = true;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.trim(),
    },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Send OTP Email
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code (never logged)
 * @param {string} purpose - 'verification' | 'reset-password'
 * @returns {Promise<{success: boolean, configured: boolean, message: string}>}
 */
const sendOtpEmail = async (toEmail, otpCode, purpose = 'verification') => {
  // Check if user accidentally pasted an SMTP key (xsmtpsib-...) into BREVO_API_KEY
  const rawBrevoKey = (process.env.BREVO_API_KEY || '').trim();
  if (rawBrevoKey && rawBrevoKey.startsWith('xsmtpsib-')) {
    return {
      success: false,
      configured: true,
      message:
        'Your BREVO_API_KEY starts with "xsmtpsib-", which is an SMTP key. Cloud hosts like Render block SMTP ports. Please go to Brevo > SMTP & API > click the "API Keys" tab (not SMTP) and generate an API key (starts with "xkeysib-").',
    };
  }

  if (!isEmailConfigured()) {
    return {
      success: false,
      configured: false,
      message: 'Email delivery is not configured on this server. Please configure BREVO_API_KEY or EMAIL_USER/EMAIL_PASS in your environment.',
    };
  }

  const subject =
    purpose === 'reset-password'
      ? 'YatraGo - Password Reset Code'
      : 'YatraGo - Your Email Verification Code';

  const actionText =
    purpose === 'reset-password'
      ? 'use this one-time code to reset your YatraGo account password'
      : 'use this one-time code to verify your YatraGo account';

  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || '10';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF7F0; margin: 0; padding: 24px; color: #302722; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #E9DFD3; border-radius: 12px; padding: 36px 32px; box-shadow: 0 6px 20px rgba(48,39,34,0.06); }
        .logo { font-size: 22px; font-weight: 800; letter-spacing: 0.12em; color: #CC5963; margin-bottom: 24px; }
        .logo span { color: #302722; }
        .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #81776F; margin-bottom: 8px; font-weight: 700; }
        h1 { font-size: 22px; margin: 0 0 16px 0; color: #302722; font-family: Georgia, serif; }
        p { font-size: 14px; line-height: 1.6; color: #5e514a; margin: 0 0 20px 0; }
        .otp-box { background: #FAF7F0; border: 1.5px dashed #CC5963; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #CC5963; font-family: monospace; }
        .footer { font-size: 11px; color: #81776F; margin-top: 24px; border-top: 1px solid #E9DFD3; padding-top: 16px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">YATRA<span>GO</span> ✳</div>
        <div class="eyebrow">A Quick Security Check</div>
        <h1>Your One-Time Passcode</h1>
        <p>Namaste! Please ${actionText}. This code is valid for <strong>${expiryMinutes} minutes</strong> and can only be used once.</p>
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>
        <p>If you did not request this verification code, you can safely ignore this email.</p>
        <div class="footer">
          YatraGo · Discover the wonder of India.<br/>
          This is an automated security message.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Namaste!\n\nPlease ${actionText}.\n\nYour OTP Code: ${otpCode}\n\nThis code expires in ${expiryMinutes} minutes.\nIf you did not request this, please ignore this email.`;

  // 1. Try Brevo HTTPS REST API first if API key is available (Port 443 - works on Render Free Tier)
  const brevoApiKey = getBrevoApiKey();
  if (brevoApiKey) {
    try {
      await sendViaBrevoApi(brevoApiKey, { toEmail, subject, html, text });
      return {
        success: true,
        configured: true,
        message: 'OTP email sent successfully via Brevo API.',
      };
    } catch (apiErr) {
      console.error(`[Brevo API Error] ${apiErr.message}`);
      return {
        success: false,
        configured: true,
        message: `Brevo API error: ${apiErr.message}`,
      };
    }
  }

  // 2. Otherwise use Nodemailer SMTP
  try {
    const transporter = createTransporter();
    const fromAddress = cleanFromAddress();

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text,
      html,
    });

    return {
      success: true,
      configured: true,
      message: 'OTP email sent successfully.',
    };
  } catch (error) {
    console.error(`[Mailer Error] Failed to send email: ${error.message}`);
    const isTimeout =
      error.message &&
      (error.message.toLowerCase().includes('timeout') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ESOCKETTIMEDOUT'));

    const message = isTimeout
      ? 'Render free tier blocks outbound SMTP ports (587/465). To fix this, generate a Brevo API Key from Brevo > SMTP & API > API Keys, and add BREVO_API_KEY in Render Environment.'
      : error.message || 'Failed to deliver email';

    return {
      success: false,
      configured: true,
      message,
    };
  }
};

module.exports = {
  isEmailConfigured,
  sendOtpEmail,
  cleanFromAddress,
  getSenderDetails,
  getBrevoApiKey,
};
