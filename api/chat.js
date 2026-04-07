const https = require(‘https’);

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

try {
const { messages } = req.body;

```
const key = process.env.ANTHROPIC_API_KEY;
if (!key) return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en Vercel' });

const lastMsg = (messages || []).filter(function(m) {
  return m && m.role === 'user' && m.content;
}).slice(-1);

if (lastMsg.length === 0) {
  lastMsg.push({ role: 'user', content: 'Hola' });
}

const body = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 512,
  system: 'Eres TuKompa, un acompanante de vida. Responde en espanol, breve y util.',
  messages: lastMsg
});

const result = await new Promise(function(resolve, reject) {
  const r = https.request({
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  }, function(resp) {
    var data = '';
    resp.on('data', function(c) { data += c; });
    resp.on('end', function() { resolve({ status: resp.statusCode, body: data }); });
  });
  r.on('error', reject);
  r.setTimeout(20000, function() { r.destroy(new Error('Timeout')); });
  r.write(body);
  r.end();
});

if (result.status !== 200) {
  return res.status(500).json({ error: 'Anthropic error ' + result.status, detail: result.body });
}

var data = JSON.parse(result.body);
var text = data.content[0].text;
return res.status(200).json({ response: text });
```

} catch (err) {
return res.status(500).json({ error: err.message });
}
};
