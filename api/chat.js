// api/chat.js — TuKompa · Vercel Serverless Function

export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type, X-User-Id, X-User-Name’);

if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

try {
const { messages, userId, userName } = req.body;

```
if (!messages || !Array.isArray(messages)) {
  return res.status(400).json({ error: 'messages array is required' });
}

const displayName = userName || 'Usuario';

const systemPrompt = `Eres TuKompa, un compañero de conversación cálido, empático e inteligente.
```

Estás hablando con ${displayName}.
Responde siempre en español, de manera natural y cercana.
Sé conciso pero completo. Evita respuestas robóticas o formales en exceso.`;

```
const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type':      'application/json',
    'x-api-key':         process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system:     systemPrompt,
    messages:   messages.map(m => ({ role: m.role, content: m.content }))
  })
});

if (!apiResponse.ok) {
  const errorText = await apiResponse.text();
  console.error('Anthropic API error:', errorText);
  return res.status(502).json({ error: 'Error al conectar con el modelo de IA' });
}

const data  = await apiResponse.json();
const reply = data.content?.[0]?.text || '';
return res.status(200).json({ reply });
```

} catch (err) {
console.error(‘chat.js error:’, err);
return res.status(500).json({ error: ‘Error interno del servidor’ });
}
}
