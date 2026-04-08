const https = require(‘https’);

module.exports = function(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) { res.status(200).end(); return; }

var key = process.env.ANTHROPIC_API_KEY;
if (!key) { res.status(200).json({ response: ‘Falta API key en Vercel’ }); return; }

// Leer body manualmente por si Vercel no lo parsea
var raw = ‘’;
req.on(‘data’, function(c) { raw += c; });
req.on(‘end’, function() {
var body = {};
try { body = JSON.parse(raw); } catch(e) {}

```
var messages = Array.isArray(body.messages) ? body.messages : [];
var userName = body.userName || 'amigo';
var userTime = body.userTime || {};
var h = parseInt(userTime.hour) || new Date().getHours();
var d = userTime.dayName || '';
var m = h < 6 ? 'madrugada' : h < 12 ? 'manana' : h < 18 ? 'tarde' : 'noche';

var system = 'Eres Profundidad, inteligencia invisible que acompana a ' + userName + '. Tiempo: ' + h + 'hs del ' + d + ' (' + m + ').\n\n' +
  'ROL AUTOMATICO sin anunciarlo: motivacion=coach directo | dolor=terapeuta | sabiduria=guia sereno | cotidiano=amigo leal | estrategia=mentor.\n\n' +
  'LEY DE LONGITUD: saludo=1-2 oraciones. verdad poderosa=1 oracion. pregunta practica=respuesta+pasos. dolor=4-6 oraciones. NUNCA mas largo de lo necesario.\n\n' +
  'VOZ: escribis como se habla, sin listas ni guiones ni asteriscos.\n' +
  'PROHIBIDO: frases vacias, "Claro que si", "Excelente pregunta", repetir mensajes.\n' +
  'CONOCIMIENTO: finanzas, negocios, salud, relaciones, psicologia, productividad, creatividad.\n' +
  'REGLAS: nunca juzgar, nunca inventar datos, siempre en espanol. Crisis: AR 135.';

// Limpiar mensajes
var clean = [];
for (var i = 0; i < messages.length; i++) {
  var mg = messages[i];
  if (!mg || !mg.role || typeof mg.content !== 'string' || !mg.content.trim()) continue;
  var prev = clean[clean.length - 1];
  if (prev && prev.role === mg.role) continue;
  clean.push({ role: mg.role, content: mg.content.trim() });
}
if (!clean.length || clean[clean.length-1].role !== 'user') {
  clean.push({ role: 'user', content: 'Hola' });
}

var payload = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 800,
  system: system,
  messages: clean.slice(-16)
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
    if (apiRes.statusCode !== 200) {
      res.status(200).json({ response: 'Error API: ' + apiRes.statusCode + ' - ' + data.slice(0,150) });
      return;
    }
    try {
      var parsed = JSON.parse(data);
      res.status(200).json({ response: parsed.content[0].text });
    } catch(e) {
      res.status(200).json({ response: 'Error parse: ' + e.message });
    }
  });
});

apiReq.on('error', function(e) {
  res.status(200).json({ response: 'Error red: ' + e.message });
});
apiReq.setTimeout(18000, function() {
  apiReq.destroy();
  res.status(200).json({ response: 'Timeout. Intentalo de nuevo.' });
});
apiReq.write(payload);
apiReq.end();
```

});
};
