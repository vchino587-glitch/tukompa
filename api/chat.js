const https = require(‘https’);

module.exports = function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) { res.status(200).end(); return; }

var key = process.env.ANTHROPIC_API_KEY;
if (!key) {
res.status(200).json({ response: ‘ERROR: Falta ANTHROPIC_API_KEY en Vercel Environment Variables’ });
return;
}

var body = (req.body && typeof req.body === ‘object’) ? req.body : {};
var messages = Array.isArray(body.messages) ? body.messages : [];
var companionType = body.companionType || ‘companero’;
var userName = body.userName || ‘amigo’;
var spiritualPath = body.spiritualPath || ‘ninguno’;
var userTime = body.userTime || {};

// Solo mensajes string, alternados correctamente
var clean = [];
for (var i = 0; i < messages.length; i++) {
var m = messages[i];
if (!m || !m.role || typeof m.content !== ‘string’ || !m.content.trim()) continue;
var prev = clean[clean.length - 1];
if (prev && prev.role === m.role) continue;
clean.push({ role: m.role, content: m.content.trim() });
}
if (!clean.length || clean[clean.length - 1].role !== ‘user’) {
clean.push({ role: ‘user’, content: ‘Hola’ });
}

var comp = {
amiga: ‘Sos la AMIGA: calida, honesta, divertida pero profunda. Verdades con amor.’,
amigo: ‘Sos el AMIGO: directo, leal. Dices la verdad aunque duela, con respeto.’,
guia: ‘Sos el GUIA ESPIRITUAL: sereno, antiguo. Guias con preguntas y metaforas.’,
coach: ‘Sos el COACH: energia, accion, resultados. Motor: que haces HOY.’,
terapeuta: ‘Sos el TERAPEUTA: escucha activa, sin juicio. Validas emociones. Nunca diagnosticas.’,
mentor: ‘Sos el MENTOR: experiencia condensada. Ensenas con ejemplos.’,
confidente: ‘Sos el CONFIDENTE: discrecion absoluta. Cero juicio.’,
companero: ‘Sos el COMPANERO: co-cerebro versatil. Completas ideas, organizas caos mental.’
}[companionType] || ‘Sos TuKompa, acompanante de vida.’;

var esp = {
cristiano: ‘El usuario es cristiano. Podes citar la Biblia cuando sea relevante.’,
islam: ‘El usuario es musulman. Respetas el Islam.’,
judaismo: ‘El usuario es judio.’,
budismo: ‘El usuario es budista. Presencia en el ahora.’,
hinduismo: ‘El usuario es hindu. Dharma, karma.’,
espiritual: ‘Camino espiritual libre.’,
ancestral: ‘Camino ancestral latinoamericano. Pachamama, Buen Vivir.’,
humanista: ‘Humanismo. Razon y compasion.’,
ninguno: ‘’
}[spiritualPath] || ‘’;

var h = parseInt(userTime.hour, 10) || 12;
var momento = h < 6 ? ‘madrugada’ : h < 12 ? ‘manana’ : h < 18 ? ‘tarde’ : ‘noche’;
var tiempo = userTime.dayName ? (’Son las ’ + h + ‘hs del ’ + userTime.dayName + ’ (’ + momento + ‘).’) : ‘’;

var system = [
’Eres TuKompa, el co-cerebro de vida de ’ + userName + ‘.’,
‘PERSONALIDAD: ’ + comp,
esp ? ‘ESPIRITUALIDAD: ’ + esp : ‘’,
tiempo,
‘LONGITUD: Responde con la densidad justa. Sin palabras vacias.’,
‘REGLAS: Nunca juzgar. Nunca alucinar datos. Responder siempre en espanol.’,
‘En crisis: Argentina 135, Mexico 800-290-0024.’
].filter(Boolean).join(’\n’);

var payload = JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 1024,
system: system,
messages: clean.slice(-20)
});

try {
var apiReq = https.request({
hostname: ‘api.anthropic.com’,
path: ‘/v1/messages’,
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: key,
‘anthropic-version’: ‘2023-06-01’,
‘Content-Length’: Buffer.byteLength(payload)
}
}, function(apiRes) {
var data = ‘’;
apiRes.on(‘data’, function(c) { data += c; });
apiRes.on(‘end’, function() {
if (apiRes.statusCode !== 200) {
res.status(200).json({ response: ’ERROR ’ + apiRes.statusCode + ’: ’ + data.substring(0, 300) });
return;
}
try {
var parsed = JSON.parse(data);
res.status(200).json({ response: parsed.content[0].text });
} catch(e) {
res.status(200).json({ response: ’ERROR parse: ’ + e.message });
}
});
});

```
apiReq.on('error', function(e) {
  res.status(200).json({ response: 'ERROR red: ' + e.message });
});

apiReq.setTimeout(8500, function() {
  apiReq.destroy();
  res.status(200).json({ response: 'ERROR: Tiempo agotado (8.5s). Intentalo de nuevo.' });
});

apiReq.write(payload);
apiReq.end();
```

} catch(e) {
res.status(200).json({ response: ’ERROR critico: ’ + e.message });
}
};
