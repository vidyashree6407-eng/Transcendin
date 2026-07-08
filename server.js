const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]', 'utf8');

function saveMessage(obj) {
  const list = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
  list.push({ ...obj, receivedAt: new Date().toISOString() });
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(list, null, 2), 'utf8');
}

async function trySendEmail({ name, email, phone, subject, message }) {
  // If SMTP config provided via env, attempt to send email
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const TO_EMAIL = process.env.TO_EMAIL || SMTP_USER;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const text = `Name: ${name}\nEmail: ${email}\nPhone: ${phone || ''}\nSubject: ${subject}\n\nMessage:\n${message}`;

  await transporter.sendMail({ from: SMTP_USER, to: TO_EMAIL, subject: `Contact form: ${subject}`, text });
  return true;
}

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    // Basic server-side sanitization
    const clean = {
      name: String(name).trim().slice(0, 200),
      email: String(email).trim().slice(0, 200),
      phone: phone ? String(phone).trim().slice(0, 50) : '',
      subject: String(subject).trim().slice(0, 200),
      message: String(message).trim().slice(0, 5000)
    };

    saveMessage(clean);

    // Try to send email if configured
    try {
      const sent = await trySendEmail(clean);
      return res.json({ ok: true, emailed: !!sent });
    } catch (err) {
      console.error('email send failed', err);
      return res.json({ ok: true, emailed: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.get('/api/messages', (req, res) => {
  try {
    const list = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
    res.json({ ok: true, messages: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Cannot read messages' });
  }
});

app.listen(PORT, () => console.log(`Contact API listening on http://localhost:${PORT}`));
