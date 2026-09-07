/* COMPLETE SECURE ENROLLMENT SYSTEM + Contact API
 * Handles:
 * - Contact form submissions
 * - Enrollment creation with validation
 * - PayPal payment integration & verification
 * - Enrollment confirmation emails
 * - Database persistence
 * 
 * Required environment variables:
 * - PAYPAL_CLIENT_ID (for client-side PayPal SDK)
 * - PAYPAL_CLIENT_SECRET (required for server-side verification)
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * - ENROLLMENT_FROM_EMAIL (optional)
 * - CONTACT_TO (recipient email for contact form)
 */
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET || process.env.PAYPAL_CLIENT_SECRET;
const paypalBaseUrl = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
const currencyByCountry = {
  'United States': 'USD',
  Canada: 'CAD',
  Australia: 'AUD'
};

function getPaymentDetails(country, amount) {
  const currency = currencyByCountry[country];
  if (!currency || !Number.isFinite(Number(amount))) {
    throw new Error('Unsupported payment country or amount');
  }
  return {
    currency,
    amount: Number(amount)
  };
}

async function getPayPalAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are not configured');
  }

  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`PayPal authentication failed (${response.status})`);
  }
  return (await response.json()).access_token;
}

async function paypalRequest(endpoint, options = {}) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || `PayPal request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

// ============================================================================
// SECURITY & MIDDLEWARE
// ============================================================================

app.use(helmet());

const configuredOrigin = process.env.ORIGIN || 'http://localhost:8000';
const allowedOrigins = new Set([
  configuredOrigin,
  'http://localhost:8000',
  'http://127.0.0.1:8000'
]);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiting: Contact endpoint
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later.' }
});

// Rate limiting: Enrollment endpoint
const enrollmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting: Payment verification
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many login attempts, please try again later.' }
});

// ============================================================================
// EMAIL SERVICE
// ============================================================================

// Transporter factory that reads from env variables
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: port ? Number(port) : 587,
      secure: port == 465,
      auth: { user, pass }
    });
  }
  return null;
}

// ============================================================================
// DATABASE HELPERS (File-based JSON storage)
// ============================================================================

const ENROLLMENTS_DIR = path.join(__dirname, 'data', 'enrollments');

function ensureEnrollmentDir() {
  if (!fs.existsSync(ENROLLMENTS_DIR)) {
    fs.mkdirSync(ENROLLMENTS_DIR, { recursive: true });
  }
}

function generateEnrollmentId() {
  return 'ENR-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function saveEnrollment(enrollment) {
  ensureEnrollmentDir();
  const filename = path.join(ENROLLMENTS_DIR, `${enrollment.enrollment_id}.json`);
  fs.writeFileSync(filename, JSON.stringify(enrollment, null, 2));
  return enrollment;
}

function getEnrollment(enrollmentId) {
  ensureEnrollmentDir();
  const filename = path.join(ENROLLMENTS_DIR, `${enrollmentId}.json`);
  if (fs.existsSync(filename)) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  }
  return null;
}

function updateEnrollment(enrollmentId, updates) {
  const enrollment = getEnrollment(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }
  const updated = { ...enrollment, ...updates, updated_at: new Date().toISOString() };
  saveEnrollment(updated);
  return updated;
}

function createAdminToken(username) {
  const payload = Buffer.from(JSON.stringify({
    username,
    expires_at: Date.now() + 8 * 60 * 60 * 1000
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', adminTokenSecret || 'missing-secret')
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function secureStringEqual(first, second) {
  const firstBuffer = Buffer.from(String(first || ''));
  const secondBuffer = Buffer.from(String(second || ''));
  return firstBuffer.length === secondBuffer.length &&
    crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function isValidAdminToken(token) {
  if (!adminTokenSecret || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const expected = crypto.createHmac('sha256', adminTokenSecret)
    .update(parts[0])
    .digest('base64url');
  const providedBuffer = Buffer.from(parts[1]);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return payload.username === adminUsername && payload.expires_at > Date.now();
  } catch (error) {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!isValidAdminToken(token)) {
    return res.status(401).json({ ok: false, error: 'Merchant authentication required' });
  }
  return next();
}

// ============================================================================
// ENROLLMENT EMAIL SERVICE
// ============================================================================

async function sendEnrollmentConfirmation(enrollment) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('SMTP not configured; skipping confirmation email');
    return false;
  }

  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #667eea; }
    .success-badge { display: inline-block; background: #4caf50; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Enrollment Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${enrollment.student_name}</strong>,</p>
      
      <p>We're excited to have you join us! Your enrollment in the course has been successfully completed.</p>
      
      <div class="success-badge">✓ ENROLLMENT ACTIVE</div>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Course:</span> ${enrollment.course_name}
        </div>
        <div class="detail-row">
          <span class="detail-label">Enrollment ID:</span> ${enrollment.enrollment_id}
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment ID:</span> ${enrollment.payment_id}
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span> ${enrollment.currency} ${enrollment.amount}
        </div>
        <div class="detail-row">
          <span class="detail-label">Enrollment Date:</span> ${new Date(enrollment.created_at).toLocaleDateString('en-IN')}
        </div>
      </div>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Name:</span> ${enrollment.student_name}
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span> ${enrollment.email}
        </div>
        <div class="detail-row">
          <span class="detail-label">Country:</span> ${enrollment.country}
        </div>
        <div class="detail-row">
          <span class="detail-label">City:</span> ${enrollment.city}
        </div>
        <div class="detail-row">
          <span class="detail-label">State/Province:</span> ${enrollment.state}
        </div>
        <div class="detail-row">
          <span class="detail-label">Postal/ZIP Code:</span> ${enrollment.pincode}
        </div>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Log in to your dashboard to access the course materials</li>
        <li>Check your email for course instructions and login credentials</li>
        <li>Join our community forum for peer support</li>
      </ul>
      
      <p>If you have any questions or need assistance, please reply to this email or contact our support team at <strong>support@transcendin.com</strong></p>
      
      <p>Thank you for choosing TranscendIN!</p>
      
      <div class="footer">
        <p>© 2026 TranscendIN. All rights reserved.</p>
        <p>This is an automated message. Please do not reply with sensitive information.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: process.env.ENROLLMENT_FROM_EMAIL || process.env.SMTP_USER,
      to: enrollment.email,
      subject: `Enrollment Confirmation – ${enrollment.course_name}`,
      html: htmlContent
    });
    
    return true;
  } catch (err) {
    console.error('Error sending enrollment email:', err.message);
    return false;
  }
}

// ============================================================================
// ENROLLMENT VALIDATION RULES
// ============================================================================

const enrollmentValidationRules = [
  body('student_name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().matches(/^[+]?[0-9\s\-()]{7,}$/).withMessage('Invalid phone number'),
  body('country').trim().isLength({ min: 2, max: 100 }).escape(),
  body('city').trim().isLength({ min: 2, max: 100 }).escape(),
  body('state').trim().isLength({ min: 2, max: 100 }).escape(),
  body('pincode').trim().isLength({ min: 3, max: 20 }).escape(),
  body('course_name').trim().isLength({ min: 2, max: 200 }).escape(),
  body('course_id').trim().isLength({ min: 1, max: 50 }).escape(),
  body('amount').isFloat({ min: 0.01, max: 1000000 }).toFloat(),
  body('message').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }).escape()
];

// ============================================================================
// ENROLLMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/admin/login
 * Authenticate the merchant dashboard without exposing the password to the browser.
 */
app.post('/api/admin/login', adminLoginLimiter, [
  body('username').trim().isLength({ min: 1, max: 100 }),
  body('password').isLength({ min: 1, max: 200 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });
  if (!adminUsername || !adminPassword || !adminTokenSecret) {
    return res.status(503).json({ ok: false, error: 'Merchant dashboard is not configured' });
  }

  const usernameMatches = secureStringEqual(req.body.username, adminUsername);
  const passwordMatches = secureStringEqual(req.body.password, adminPassword);
  if (!usernameMatches || !passwordMatches) {
    return res.status(401).json({ ok: false, error: 'Invalid merchant credentials' });
  }
  return res.json({ ok: true, token: createAdminToken(req.body.username) });
});

/**
 * GET /api/admin/enrollments
 * Return protected enrollment records for the merchant dashboard.
 */
app.get('/api/admin/enrollments', requireAdmin, (req, res) => {
  try {
    ensureEnrollmentDir();
    const search = String(req.query.search || '').trim().toLowerCase();
    const status = String(req.query.status || '').trim().toUpperCase();
    const enrollments = fs.readdirSync(ENROLLMENTS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => JSON.parse(fs.readFileSync(path.join(ENROLLMENTS_DIR, file), 'utf8')))
      .filter(enrollment => !status || enrollment.enrollment_status === status)
      .filter(enrollment => {
        if (!search) return true;
        return [enrollment.enrollment_id, enrollment.student_name, enrollment.email,
          enrollment.course_name, enrollment.country].some(value =>
          String(value || '').toLowerCase().includes(search));
      })
      .sort((first, second) => new Date(second.created_at) - new Date(first.created_at));

    return res.json({ ok: true, count: enrollments.length, enrollments });
  } catch (err) {
    console.error('Error listing enrollments:', err);
    return res.status(500).json({ ok: false, error: 'Failed to load enrollments' });
  }
});

/**
 * POST /api/enrollment/create
 * Create a new enrollment with PENDING_PAYMENT status
 */
app.post('/api/enrollment/create', enrollmentLimiter, enrollmentValidationRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  const {
    student_name,
    email,
    phone,
    country,
    city,
    state,
    pincode,
    course_name,
    course_id,
    amount,
    message
  } = req.body;

  try {
    const enrollmentId = generateEnrollmentId();
    const now = new Date().toISOString();

    const enrollment = {
      enrollment_id: enrollmentId,
      course_id,
      course_name,
      student_name,
      email,
      phone,
      country,
      city,
      state,
      pincode,
      message: message || '',
      ...getPaymentDetails(country, amount),
      payment_id: null,
      payment_status: 'PENDING',
      enrollment_status: 'PENDING_PAYMENT',
      created_at: now,
      updated_at: now
    };

    saveEnrollment(enrollment);

    return res.json({
      ok: true,
      message: 'Enrollment created successfully',
      enrollment_id: enrollmentId,
      enrollment
    });
  } catch (err) {
    console.error('Error creating enrollment:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create enrollment' });
  }
});

/**
 * GET /api/paypal/config
 * Return only the public client-side PayPal configuration.
 */
app.get('/api/paypal/config', (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID) {
    return res.status(503).json({ ok: false, error: 'PayPal is not configured' });
  }
  return res.json({
    ok: true,
    client_id: process.env.PAYPAL_CLIENT_ID,
    currencies: currencyByCountry
  });
});

/**
 * POST /api/enrollment/paypal/order
 * Create a PayPal order using the amount stored on the enrollment.
 */
app.post('/api/enrollment/paypal/order', paymentLimiter, [
  body('enrollment_id').trim().isLength({ min: 10, max: 50 }).escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });

  try {
    const enrollment = getEnrollment(req.body.enrollment_id);
    if (!enrollment) return res.status(404).json({ ok: false, error: 'Enrollment not found' });
    if (enrollment.enrollment_status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ ok: false, error: 'Enrollment is not awaiting payment' });
    }

    const order = await paypalRequest('/v2/checkout/orders', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: enrollment.enrollment_id,
          custom_id: enrollment.enrollment_id,
          description: enrollment.course_name,
          amount: { currency_code: enrollment.currency, value: Number(enrollment.amount).toFixed(2) }
        }]
      })
    });

    updateEnrollment(enrollment.enrollment_id, {
      paypal_order_id: order.id,
      paypal_order_status: order.status
    });
    return res.json({ ok: true, order_id: order.id });
  } catch (err) {
    console.error('Error creating PayPal order:', err);
    return res.status(502).json({ ok: false, error: 'Unable to create PayPal order' });
  }
});

/**
 * POST /api/enrollment/verify-payment
 * Capture and verify a PayPal order on the server, then update enrollment status.
 */
app.post('/api/enrollment/verify-payment', paymentLimiter, [
  body('enrollment_id').trim().isLength({ min: 10, max: 50 }).escape(),
  body('order_id').trim().isLength({ min: 5, max: 100 }).escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  const { enrollment_id, order_id } = req.body;

  try {
    // Get enrollment and verify amount
    const enrollment = getEnrollment(enrollment_id);
    if (!enrollment) {
      return res.status(404).json({ ok: false, error: 'Enrollment not found' });
    }

    // Prevent duplicate payments
    if (enrollment.enrollment_status === 'PAID') {
      return res.status(400).json({
        ok: false,
        error: 'Enrollment already marked as PAID',
        enrollment_id,
        message: 'This enrollment has already been completed.'
      });
    }

    if (enrollment.paypal_order_id !== order_id) {
      return res.status(400).json({ ok: false, error: 'PayPal order does not match enrollment' });
    }

    const capture = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(order_id)}/capture`, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: '{}'
    });
    const unit = capture.purchase_units?.[0];
    const captureDetails = unit?.payments?.captures?.[0];
    const paidAmount = captureDetails?.amount;
    if (capture.status !== 'COMPLETED' || captureDetails?.status !== 'COMPLETED' ||
        unit?.custom_id !== enrollment_id || paidAmount?.currency_code !== enrollment.currency ||
        Number(paidAmount.value) !== Number(enrollment.amount).toFixed(2) * 1) {
      return res.status(400).json({ ok: false, error: 'PayPal payment could not be verified' });
    }

    // Update enrollment
    const updatedEnrollment = updateEnrollment(enrollment_id, {
      payment_id: captureDetails.id,
      payment_method: 'paypal',
      paypal_order_id: order_id,
      paypal_capture_id: captureDetails.id,
      paypal_order_status: capture.status,
      paypal_capture_status: captureDetails.status,
      paypal_currency: paidAmount.currency_code,
      paypal_payer_email: capture.payer?.email_address || null,
      paypal_payer_id: capture.payer?.payer_id || null,
      paypal_captured_at: captureDetails.create_time || new Date().toISOString(),
      payment_status: 'SUCCESS',
      enrollment_status: 'PAID'
    });

    // Send confirmation email
    await sendEnrollmentConfirmation(updatedEnrollment);

    return res.json({
      ok: true,
      message: 'Payment verified successfully. Enrollment confirmed!',
      enrollment_id,
      enrollment: updatedEnrollment
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ ok: false, error: 'Payment verification failed' });
  }
});

/**
 * POST /api/enrollment/payment-failed
 * Mark payment as failed
 */
app.post('/api/enrollment/payment-failed', enrollmentLimiter, [
  body('enrollment_id').trim().isLength({ min: 10, max: 50 }).escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  const { enrollment_id } = req.body;

  try {
    const enrollment = getEnrollment(enrollment_id);
    if (!enrollment) {
      return res.status(404).json({ ok: false, error: 'Enrollment not found' });
    }

    if (enrollment.enrollment_status !== 'PENDING_PAYMENT') {
      return res.status(400).json({
        ok: false,
        error: 'Cannot mark as failed - enrollment status changed',
        enrollment_id
      });
    }

    const updated = updateEnrollment(enrollment_id, {
      payment_status: 'FAILED',
      enrollment_status: 'PAYMENT_FAILED'
    });

    return res.json({
      ok: true,
      message: 'Payment failure recorded',
      enrollment_id,
      enrollment: updated
    });
  } catch (err) {
    console.error('Error recording payment failure:', err);
    return res.status(500).json({ ok: false, error: 'Failed to record payment failure' });
  }
});

/**
 * GET /api/enrollment/:enrollment_id
 * Retrieve enrollment details
 */
app.get('/api/enrollment/:enrollment_id', (req, res) => {
  try {
    const enrollment = getEnrollment(req.params.enrollment_id);
    if (!enrollment) {
      return res.status(404).json({ ok: false, error: 'Enrollment not found' });
    }

    return res.json({
      ok: true,
      enrollment
    });
  } catch (err) {
    console.error('Error retrieving enrollment:', err);
    return res.status(500).json({ ok: false, error: 'Failed to retrieve enrollment' });
  }
});

/**
 * POST /api/enrollment/validate-email
 * Check if email is already enrolled in a course
 */
app.post('/api/enrollment/validate-email', [
  body('email').isEmail().normalizeEmail(),
  body('course_id').trim().isLength({ min: 1, max: 50 }).escape()
], (req, res) => {
  try {
    const { email, course_id } = req.body;
    
    ensureEnrollmentDir();
    const files = fs.readdirSync(ENROLLMENTS_DIR).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const enrollment = JSON.parse(fs.readFileSync(path.join(ENROLLMENTS_DIR, file), 'utf8'));
      if (enrollment.email === email && enrollment.course_id === course_id && enrollment.enrollment_status === 'PAID') {
        return res.json({
          ok: true,
          exists: true,
          message: 'You are already enrolled in this course'
        });
      }
    }

    return res.json({
      ok: true,
      exists: false
    });
  } catch (err) {
    console.error('Error validating email:', err);
    return res.status(500).json({ ok: false, error: 'Email validation failed' });
  }
});

// ============================================================================
// CONTACT ENDPOINTS
// ============================================================================
app.post('/api/contact', contactLimiter, [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).escape(),
  body('subject').trim().isLength({ min: 2, max: 200 }).escape(),
  body('message').trim().isLength({ min: 5, max: 5000 }).escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }

  const { name, email, phone, subject, message } = req.body;

  // create transporter
  const transporter = createTransporter();
  const contactTo = process.env.CONTACT_TO || process.env.SMTP_USER;

  if (!transporter) {
    // Safe fallback: do not expose credentials. In dev, simply log minimal message.
    console.warn('SMTP not configured; skipping send.');
    return res.json({ ok: true, emailed: false, message: 'Message received (email not configured).' });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.CONTACT_FROM || `no-reply@${process.env.SMTP_HOST || 'localhost'}`,
      to: contactTo,
      subject: `[Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || ''}\n\nMessage:\n${message}`
    });
    return res.json({ ok: true, emailed: true, message: 'Message sent', id: info.messageId });
  } catch (err) {
    console.error('Error sending contact email', err && err.message);
    return res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
});

app.listen(port, () => {
  console.log(`\n✓ Express server listening on port ${port}`);
  console.log(`  Endpoints: /api/contact, /api/enrollment/*, /api/enrollment/validate-email`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
