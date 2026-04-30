const express = require('express');
const path = require('path');
const fetch = global.fetch || require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/generate', async (req, res) => {
  const { text, model } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });
  const apiKey = process.env.GENERATIVE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfigured: missing GENERATIVE_API_KEY' });
  const modelName = model || 'gemini-2.5-flash-preview-09-2025';
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text }] }], systemInstruction: { parts: [{ text: "You are a Senior Data Mentor. Convert the user's technical finding into a professional Business Insight impact statement for a resume. Max 40 words." }] } };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await r.json();
    const textOut = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || null;
    return res.json({ text: textOut, raw: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
