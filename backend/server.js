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

app.use(cors());
app.use(bodyParser.json());

// Serve static frontend
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// AI Email Generator/Prompt
app.post('/generate-emails', async (req, res) => {
  const { userInput, recipientName, senderName } = req.body;

const closingName = (typeof senderName === 'string' && senderName.trim()) ? senderName.trim() : "SmartEmailer";
const prompt = `
You are a world-class email marketing copywriter working for a high-converting digital agency.

Create 3 unique, high-performing, professional marketing emails for a product/service: "${userInput}".

Target recipient name: ${recipientName || 'there'}.

Each email must include:
- A compelling, personalized subject line that drives curiosity or benefit
- A warm greeting using the recipient's name (if provided)
- 2 short, persuasive paragraphs focused on benefits (not just features)
- A strong call-to-action (e.g., "Shop now", "Book a free call", "Try it today")
- The closing MUST use exactly this sender name: "${closingName}" (do NOT use any other name, company, or phrase such as "your company", "best regards", or "sincerely")

Tone:
- Friendly yet professional
- Benefit-driven, focused on solving a pain point
- Optimized for cold outreach or campaign conversion

Formatting:
- Start every paragraph (including greeting and closing) with exactly 3 spaces for indentation. Do NOT skip this.
- Clearly format so each email starts with:  
  **Email 1: Subject:** [subject text]
- Use spacing and line breaks so it's easy to extract each email individually.

Do NOT use generic phrases like "Your Company" in the closing. Only use "${closingName}".
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
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

// 📧 Send Emails via Resend
app.post('/send-mass-emails', async (req, res) => {
  const { emails, recipients, senderName } = req.body;

  if (!emails || !recipients || emails.length === 0 || recipients.length === 0) {
    return res.status(400).json({ error: 'Emails or recipients missing.' });
  }

  // Ensure senderName is a valid, non-empty string for the display name
  const displayName = (typeof senderName === 'string' && senderName.trim()) ? senderName.trim() : 'SmartEmailer';
  const from = `${displayName} <onboarding@resend.dev>`;

  try {
    for (let i = 0; i < recipients.length; i++) {
      const to = recipients[i];
      const { subject, body } = emails[i % emails.length]; // Rotate messages

      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html: body.replace(/\n/g, "<br>")
      });

      if (error) {
        console.error("❌ Resend API error:", error);
        throw new Error(error.message || 'Failed to send email');
      }
    }

    res.json({ success: true, message: 'Emails sent successfully.' });

  } catch (err) {
    console.error("❌ Email sending failed:", err.message || err);
    res.status(500).json({ error: 'Failed to send some or all emails.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running: http://localhost:${PORT}`);
});