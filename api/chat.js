var https = require(‘https’);

module.exports = function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) {
res.status(200).end();
return;
}

if (req.method !== ‘POST’) {
res.status(405).json({ error: ‘Method not allowed’ });
return;
}

var key = process.env.ANTHROPIC_API_KEY;
if (!key) {
res.status(500).json({ error: ‘ANTHROPIC_API_KEY no configurada en Vercel Environment Variables’ });
return;
}

// Parsear body manualmente por si Vercel no lo parsea automáticamente
var rawBody = ‘’;
req.on(‘data’, function(chunk) { rawBody += chunk; });
req.on(‘end’, function() {
var parsed;
try {
parsed = JSON.parse(rawBody);
} catch(e) {
parsed = {};
}

```
var messages = parsed.messages || [];

// Tomar solo mensajes válidos de usuario, sin consecutivos del mismo rol
var clean = [];
for (var i = 0; i < messages.length; i++) {
  var m = messages[i];
  if (!m || !m.role || !m.content) continue;
  if (typeof m.content !== 'string') continue; // solo strings
  var prev = clean[clean.length - 1];
  if (prev && prev.role === m.role) continue;
  clean.push({ role: m.role, content: m.content });
}

// Asegurar que termina en user
var lastValid = clean[clean.length - 1];
if (!lastValid || lastValid.role !== 'user') {
  clean = [{ role: 'user', content: 'Hola' }];
}

var finalMessages = clean.slice(-10); // max 10 mensajes

var bodyStr = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 512,
  system: 'Eres TuKompa, acompanante de vida. Responde en espanol, breve y util. Sin juicios.',
  messages: finalMessages
});

var options = {
  hostname: 'api.anthropic.com',
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'Content-Length': Buffer.byteLength(bodyStr)
  }
};

var apiReq = https.request(options, function(apiRes) {
  var data = '';
  apiRes.on('data', function(c) { data += c; });
  apiRes.on('end', function() {
    if (apiRes.statusCode !== 200) {
      res.status(500).json({ error: 'Anthropic ' + apiRes.statusCode, detail: data });
      return;
    }
    try {
      var result = JSON.parse(data);
      var text = result.content[0].text;
      res.status(200).json({ response: text });
    } catch(e) {
      res.status(500).json({ error: 'Parse error: ' + e.message, raw: data });
    }
  });
});

apiReq.on('error', function(e) {
  res.status(500).json({ error: 'Request error: ' + e.message });
});

apiReq.setTimeout(20000, function() {
  apiReq.destroy();
  res.status(500).json({ error: 'Timeout 20s' });
});

apiReq.write(bodyStr);
apiReq.end();
```

});
};
