const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from 'public' folder
const publicPath = path.join(__dirname, 'public');
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(publicPath));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// AI Email Generator
app.post('/generate-emails', async (req, res) => {
  const { userInput, recipientName, senderName } = req.body;

  const closingName = senderName?.trim() || "SmartEmailer";
  const prompt = `
You are a world-class email marketing copywriter. Create 3 high-performing emails for: "${userInput}".
Target recipient name: ${recipientName || 'there'}.
Closing must use exactly: "${closingName}".
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (output) {
      res.json({ output });
    } else {
      res.status(500).json({ error: 'No valid response from Gemini.' });
    }
  } catch (err) {
    console.error("❌ Gemini error:", err.message || err);
    res.status(500).json({ error: 'AI generation failed.' });
  }
});

// Send Mass Emails
app.post('/send-mass-emails', async (req, res) => {
  const { emails, recipients, senderName } = req.body;

  if (!emails?.length || !recipients?.length) {
    return res.status(400).json({ error: 'Emails or recipients missing.' });
  }

  const from = `${senderName?.trim() || 'SmartEmailer'} <onboarding@resend.dev>`;

  try {
    for (let i = 0; i < recipients.length; i++) {
      const { subject, body } = emails[i % emails.length];
      const to = recipients[i];

      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html: body.replace(/\n/g, '<br>')
      });

      if (error) {
        console.error("❌ Resend error:", error);
        throw new Error(error.message || 'Failed to send email');
      }
    }

    res.json({ success: true, message: 'Emails sent successfully.' });
  } catch (err) {
    console.error("❌ Email sending failed:", err.message || err);
    res.status(500).json({ error: 'Failed to send some or all emails.' });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
