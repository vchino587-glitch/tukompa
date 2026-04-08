const https = require(‘https’);

module.exports = function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) { res.status(200).end(); return; }

var key = process.env.ANTHROPIC_API_KEY;
if (!key) { res.json({ response: ‘ERROR: Falta ANTHROPIC_API_KEY en Vercel Environment Variables’ }); return; }

// Vercel puede parsear el body automaticamente O no — manejamos ambos casos
function proceed(body) {
var messages = Array.isArray(body.messages) ? body.messages : [];
var nombre = body.userName || ‘amigo’;

```
// Solo el ultimo mensaje del usuario para que no falle
var lastMsg = 'Hola';
for (var i = messages.length - 1; i >= 0; i--) {
  if (messages[i] && messages[i].role === 'user' && typeof messages[i].content === 'string') {
    lastMsg = messages[i].content;
    break;
  }
}

var payload = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 600,
  system: 'Eres Profundidad, acompanante de vida de ' + nombre + '. Responde en espanol, breve y util. Sin listas ni guiones. Como se habla.',
  messages: [{ role: 'user', content: lastMsg }]
});

var apiReq = https.request({
  hostname: 'api.anthropic.com',
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'Content-Length': Buffer.byteLength(payload)
  }
}, function(apiRes) {
  var data = '';
  apiRes.on('data', function(c) { data += c; });
  apiRes.on('end', function() {
    try {
      var d = JSON.parse(data);
      if (d.content && d.content[0]) {
        res.json({ response: d.content[0].text });
      } else {
        res.json({ response: 'ERROR API: ' + data.slice(0, 200) });
      }
    } catch(e) {
      res.json({ response: 'ERROR parse: ' + e.message });
    }
  });
});

apiReq.on('error', function(e) { res.json({ response: 'ERROR red: ' + e.message }); });
apiReq.setTimeout(15000, function() { apiReq.destroy(); res.json({ response: 'Timeout. Reintenta.' }); });
apiReq.write(payload);
apiReq.end();
```

}

// Si body ya esta parseado (Vercel lo hace automaticamente con JSON)
if (req.body && typeof req.body === ‘object’) {
proceed(req.body);
} else {
// Leer stream manualmente
var raw = ‘’;
req.on(‘data’, function(c) { raw += c; });
req.on(‘end’, function() {
var b = {};
try { b = JSON.parse(raw); } catch(e) {}
proceed(b);
});
}
};
