/* Secure contact API
 * Usage: set environment variables for SMTP and run `node server.js`
 * Required env vars:
 *  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *  - CONTACT_TO (recipient email)
 */
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

// Basic security headers
app.use(helmet());

// CORS - restrict in production by setting ORIGIN env
const allowedOrigin = process.env.ORIGIN || 'http://localhost:8000';
app.use(cors({ origin: allowedOrigin }));

// JSON parsing with size limit
app.use(express.json({ limit: '10kb' }));

// Rate limiting: 60 requests per 10 minutes per IP to protect contact endpoint
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later.' }
});

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
      secure: port == 465, // true for 465, false for other ports
      auth: { user, pass }
    });
  }
  return null;
}

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
  console.log(`Secure server listening on port ${port}`);
});
