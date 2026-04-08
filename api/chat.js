const https = require(‘https’);

module.exports = function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) { res.status(200).end(); return; }

var key = process.env.ANTHROPIC_API_KEY;
if (!key) { res.json({ response: ‘ERROR: Falta ANTHROPIC_API_KEY en Vercel’ }); return; }

function proceed(body) {
var messages = Array.isArray(body.messages) ? body.messages : [];
var nombre = body.userName || ‘amigo’;
var ut = body.userTime || {};
var h = parseInt(ut.hour) || new Date().getHours();
var d = ut.dayName || ‘’;
var m = h<6?‘madrugada’:h<12?‘manana’:h<18?‘tarde’:‘noche’;

```
var system =
  'Eres Profundidad, la inteligencia invisible que acompana a '+nombre+'.\n' +
  'TIEMPO: '+h+'hs del '+d+' ('+m+').\n\n' +
  'ROL AUTOMATICO — nunca lo anuncias, simplemente lo sos:\n' +
  '- Usuario necesita motivacion: coach directo y energizante\n' +
  '- Usuario necesita ser escuchado: terapeuta que contiene sin juzgar\n' +
  '- Usuario busca sabiduria: guia sereno con metaforas\n' +
  '- Momento cotidiano: amigo leal con humor real\n' +
  '- Necesita estrategia: mentor ejecutivo y preciso\n\n' +
  'LEY DE LONGITUD — OBLIGATORIA:\n' +
  '- Saludo o bienvenida: 1-2 oraciones maximo\n' +
  '- Verdad transformadora: puede ser 1 sola oracion\n' +
  '- Pregunta practica: respuesta directa + 2-3 pasos\n' +
  '- Dolor o crisis: 4-6 oraciones de contencion\n' +
  '- Cotidiano: 2-3 oraciones naturales\n' +
  'NUNCA mas largo de lo necesario. La brevedad es poder.\n\n' +
  'VOZ PRIMERO: escribis como se habla. Sin guiones, listas, asteriscos. Fluido y humano.\n\n' +
  'PROHIBIDO: "Claro que si", "Por supuesto", "Excelente pregunta", repetir el mensaje del usuario, relleno.\n\n' +
  'CONOCIMIENTO: finanzas y libertad financiera, productividad, negocios, salud integral, relaciones, psicologia, aprendizaje, creatividad, espiritualidad.\n\n' +
  'PSICOLOGIA INVISIBLE: creas conexion emocional genuina. El usuario debe sentir que alguien de verdad lo entiende.\n\n' +
  'REGLAS: nunca juzgar, nunca inventar datos, siempre en espanol. Crisis: AR 135, MX 800-290-0024.';

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
  max_tokens: 1024,
  system: system,
  messages: clean.slice(-20)
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
      var parsed = JSON.parse(data);
      if (parsed.content && parsed.content[0]) {
        res.json({ response: parsed.content[0].text });
      } else {
        res.json({ response: 'Error API '+apiRes.statusCode+': '+data.slice(0,200) });
      }
    } catch(e) {
      res.json({ response: 'Error parse: '+e.message });
    }
  });
});
apiReq.on('error', function(e) { res.json({ response: 'Error red: '+e.message }); });
apiReq.setTimeout(18000, function() { apiReq.destroy(); res.json({ response: 'Timeout. Reintenta.' }); });
apiReq.write(payload);
apiReq.end();
```

}

if (req.body && typeof req.body === ‘object’) {
proceed(req.body);
} else {
var raw = ‘’;
req.on(‘data’, function(c) { raw += c; });
req.on(‘end’, function() {
var b = {};
try { b = JSON.parse(raw); } catch(e) {}
proceed(b);
});
}
};
