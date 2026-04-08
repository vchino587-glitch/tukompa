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
  'Eres Profundidad, la inteligencia invisible que acompana a '+nombre+'.\n'+
  'TIEMPO: '+h+'hs del '+d+' ('+m+').\n\n'+
  'ROL AUTOMATICO sin anunciarlo: motivacion=coach directo | dolor=terapeuta | sabiduria=guia sereno | cotidiano=amigo leal | estrategia=mentor ejecutivo.\n\n'+
  'LEY DE LONGITUD: saludo=1-2 oraciones. verdad=1 oracion. practica=respuesta+pasos. dolor=4-6 oraciones. NUNCA mas largo.\n\n'+
  'VOZ: sin listas, sin guiones, sin asteriscos. Como se habla.\n'+
  'PROHIBIDO: "Claro que si", "Por supuesto", "Excelente pregunta", repetir mensajes, relleno.\n'+
  'CONOCIMIENTO: finanzas, negocios, salud, relaciones, psicologia, productividad, creatividad.\n'+
  'REGLAS: nunca juzgar, nunca inventar datos, siempre en espanol. Crisis: AR 135.';

var clean = [];
for (var i = 0; i < messages.length; i++) {
  var mg = messages[i];
  if (!mg || !mg.role || typeof mg.content !== 'string' || !mg.content.trim()) continue;
  var prev = clean[clean.length-1];
  if (prev && prev.role === mg.role) continue;
  clean.push({ role: mg.role, content: mg.content.trim() });
}
if (!clean.length || clean[clean.length-1].role !== 'user') clean.push({ role:'user', content:'Hola' });

var payload = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: system,
  messages: clean.slice(-20)
});

var apiReq = https.request({
  hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
  headers: {
    'Content-Type': 'application/json', 'x-api-key': key,
    'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(payload)
  }
}, function(apiRes) {
  var data = '';
  apiRes.on('data', function(c) { data += c; });
  apiRes.on('end', function() {
    try {
      var p = JSON.parse(data);
      res.json({ response: p.content && p.content[0] ? p.content[0].text : 'Error API: '+data.slice(0,150) });
    } catch(e) { res.json({ response: 'Error: '+e.message }); }
  });
});
apiReq.on('error', function(e) { res.json({ response: 'Error red: '+e.message }); });
apiReq.setTimeout(18000, function() { apiReq.destroy(); res.json({ response: 'Timeout. Reintenta.' }); });
apiReq.write(payload); apiReq.end();
```

}

if (req.body && typeof req.body === ‘object’) { proceed(req.body); }
else {
var raw = ‘’;
req.on(‘data’, function(c) { raw += c; });
req.on(‘end’, function() { var b={}; try{b=JSON.parse(raw);}catch(e){} proceed(b); });
}
};
