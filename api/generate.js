export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, model } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });

  const apiKey = process.env.GENERATIVE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfigured: missing GENERATIVE_API_KEY' });

  const modelName = model || 'gemini-2.5-flash-preview-09-2025';

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text }] }],
      systemInstruction: {
        parts: [{
          text: "You are a Senior Data Mentor. Convert the user's technical finding into a professional Business Insight impact statement for a resume. Max 40 words."
        }]
      }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    return res.json({ text: textOut, raw: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
