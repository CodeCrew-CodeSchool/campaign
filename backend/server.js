const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/generate-emails', async (req, res) => {
  const { userInput, recipientName } = req.body;

  const prompt = `
You are an expert marketing assistant. Write 3 short, professional marketing emails as part of a campaign about "${userInput}" for a customer named ${recipientName || 'there'}.

Each email should include:
- A subject line
- A greeting
- 2 to 3 short paragraphs
- A clear call-to-action
- A closing

Separate each email clearly with line spacing.
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    console.log("Gemini Flash Response:", JSON.stringify(data, null, 2));

    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (output) {
      res.json({ output });
    } else {
      res.status(500).json({ error: 'No valid response from Gemini Flash.' });
    }
  } catch (error) {
    console.error("❌ Request error:", error);
    res.status(500).json({ error: 'Failed to generate emails.' });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));