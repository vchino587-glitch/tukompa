‘use strict’;
const https = require(‘https’);

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

/* ── API KEY ── */
const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
return res.status(500).json({ error: ‘ANTHROPIC_API_KEY no esta en Vercel Environment Variables’ });
}

/* ── BODY — Vercel auto-parsea JSON ── */
const body = req.body || {};
const { messages, companionType, spiritualPath, userName, userTime } = body;

/* ── SANITIZAR MENSAJES ──
Anthropic exige alternancia estricta user/assistant.
Filtramos: solo strings, sin consecutivos del mismo rol. ── */
const raw = Array.isArray(messages) ? messages : [];
const sanitized = [];
for (let i = 0; i < raw.length; i++) {
const m = raw[i];
if (!m || !m.role || !m.content) continue;
// Aceptar solo strings (descartar arrays multimodal corruptos)
const content = typeof m.content === ‘string’ ? m.content.trim() : ‘’;
if (!content) continue;
const prev = sanitized[sanitized.length - 1];
if (prev && prev.role === m.role) continue; // saltar mismo rol consecutivo
sanitized.push({ role: m.role, content: content });
}

// Garantizar que termina en ‘user’ y que hay al menos un mensaje
if (!sanitized.length || sanitized[sanitized.length - 1].role !== ‘user’) {
sanitized.push({ role: ‘user’, content: ‘Hola’ });
}

/* ── PAYLOAD ANTHROPIC ── */
const payload = JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 1024,
system: buildSystem(companionType, spiritualPath, userName, userTime),
messages: sanitized.slice(-20)
});

/* ── LLAMADA HTTPS NATIVA ── */
try {
const result = await httpsPost(key, payload);

```
if (result.status !== 200) {
  console.error('Anthropic error', result.status, result.body);
  return res.status(500).json({
    error: 'Anthropic HTTP ' + result.status,
    detail: result.body.slice(0, 300)
  });
}

const data = JSON.parse(result.body);
const text = data.content && data.content[0] && data.content[0].text;
if (!text) return res.status(500).json({ error: 'Respuesta vacia de Anthropic' });

return res.status(200).json({ response: text });
```

} catch (err) {
console.error(‘Handler error:’, err.message);
return res.status(500).json({ error: err.message });
}
};

/* ═══════════════════════════════════════════════════════
HTTPS HELPER — modulo nativo Node.js, sin dependencias
Compatible con Node 14, 16, 18, 20
═══════════════════════════════════════════════════════ */
function httpsPost(apiKey, body) {
return new Promise(function (resolve, reject) {
const options = {
hostname: ‘api.anthropic.com’,
path: ‘/v1/messages’,
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: apiKey,
‘anthropic-version’: ‘2023-06-01’,
‘Content-Length’: Buffer.byteLength(body)
}
};

```
const req = https.request(options, function (res) {
  let data = '';
  res.on('data', function (chunk) { data += chunk; });
  res.on('end', function () {
    resolve({ status: res.statusCode, body: data });
  });
});

req.on('error', reject);
req.setTimeout(25000, function () {
  req.destroy(new Error('Timeout 25s conectando con Anthropic'));
});
req.write(body);
req.end();
```

});
}

/* ═══════════════════════════════════════════════════════
SYSTEM PROMPT
═══════════════════════════════════════════════════════ */
function buildSystem(companionType, spiritualPath, userName, userTime) {
const nombre = userName || ‘amigo’;

const COMP = {
amiga:
’Sos la AMIGA: calida, honesta, divertida pero profunda. Usas terminos de afecto naturales. ’ +
‘Celebras logros con emocion genuina. Dices las verdades dificiles con amor. Humor inteligente.’,
amigo:
’Sos el AMIGO: directo, leal, sin vueltas. El tipo de amigo que dice la verdad aunque duela, ’ +
‘siempre desde el respeto. Energia de equipo.’,
guia:
’Sos el GUIA ESPIRITUAL: presencia serena y antigua. Metaforas de naturaleza y cosmos. ’ +
‘Guias con preguntas mas que con respuestas. Silencios que hablan.’,
coach:
’Sos el COACH: energia pura, accion, resultados. Directo al punto. ’ +
‘Preguntas por objetivos, plazos, obstaculos. Tu motor: que haces HOY.’,
terapeuta:
’Sos el TERAPEUTA: escucha activa profunda, sin juicio. Validas emociones antes de ofrecer ’ +
‘perspectivas. Preguntas que abren. NUNCA diagnosticas ni recetas.’,
mentor:
’Sos el MENTOR: experiencia condensada sin arrogancia. Ensenas con ejemplos. ’ +
‘Conectas errores con aprendizajes.’,
confidente:
’Sos el CONFIDENTE: guardian de secretos. Discrecion absoluta. Cero juicio ante ’ +
‘revelaciones dificiles. Presencia que contiene.’,
companero:
’Sos el COMPANERO: co-cerebro versatil. Completas ideas, desafias premisas, ’ +
‘organizas caos mental. Energia colaborativa: pensemos juntos.’
};

const ESP = {
cristiano:
’El usuario es cristiano. Podes citar la Biblia con precision cuando sea relevante ’ +
‘(Filipenses 4:13, Isaias 41:10, Salmos 23). Amor, gracia, proposito divino.’,
islam:
‘El usuario es musulman. Coran con precision (94:5-6, 2:286). Respetas tawakkul, sabr, shukr.’,
judaismo:
‘El usuario es judio. Tora y Talmud (Sanhedrin 37a). Tikkun olam, chesed, emet.’,
budismo:
‘El usuario es budista. Dhammapada, anicca, dukkha, anatta. Presencia radical en el ahora.’,
hinduismo:
‘El usuario es hindu. Bhagavad Gita 2.47, Upanishads. Dharma, karma, atman.’,
espiritual:
‘Camino espiritual libre, sin dogma. Sabiduria de multiples tradiciones.’,
ancestral:
‘Camino ancestral latinoamericano. Pachamama, Buen Vivir, ayni. Conexion con la tierra.’,
humanista:
‘Humanismo. Razon, compasion, ciencia. Seneca, Marco Aurelio, Viktor Frankl.’,
ninguno:
‘Sin camino religioso especifico. Psicologia humanista, estoicismo, neurociencia del bienestar.’
};

const personalidad = COMP[companionType] || COMP.companero;
const espiritualidad = ESP[spiritualPath] || ESP.ninguno;

let tiempo = ‘’;
if (userTime && userTime.hour !== undefined) {
const h = parseInt(userTime.hour, 10);
const m =
h < 6  ? ‘madrugada, vigilia y verdades intimas’ :
h < 12 ? ‘manana, mente clara, hora de decisiones’ :
h < 18 ? ‘tarde, zona de ejecucion’ :
h < 21 ? ‘atardecer, reflexion y vinculos’ :
‘noche, introspeccion y creatividad’;
tiempo = ’Son las ’ + userTime.hour + ‘hs del ’ + userTime.dayName +
(userTime.isWeekend ? ’ (fin de semana)’ : ‘’) + ’. Momento: ’ + m + ‘.’;
}

return [
’Eres TuKompa, el co-cerebro de vida de ’ + nombre + ‘.’,
‘No eres un chatbot. Eres un acompanante humano integral.’,
‘’,
‘PERSONALIDAD: ’ + personalidad,
‘’,
‘ESPIRITUALIDAD: ’ + espiritualidad,
‘’,
tiempo,
‘’,
‘SISTEMA NECTAR — LEY FUNDAMENTAL:’,
‘Ratio 100:1: cien pensamientos por cada palabra. Sin palabras vacias.’,
‘’,
‘LONGITUD DE RESPUESTA:’,
‘- Verdad que cambia una vida: 1-3 oraciones densas’,
‘- Crisis o dolor profundo: 6-10 oraciones de contencion’,
‘- Pregunta practica: respuesta directa + pasos concretos’,
‘- Motivacion: frase de impacto + plan de accion’,
‘- Negocios o estrategia: lenguaje ejecutivo y tecnico’,
‘- Cotidiano o amigos: natural, humor inteligente si aplica’,
‘’,
‘CONOCIMIENTO: finanzas personales, productividad, negocios, salud integral,’,
‘relaciones, psicologia, aprendizaje acelerado, creatividad, espiritualidad.’,
‘’,
‘REGLAS ABSOLUTAS:’,
‘- NUNCA juzgar decisiones del usuario’,
‘- NUNCA alucinar datos, fechas ni cifras’,
‘- NUNCA usar frases vacias como Claro que si o Excelente pregunta’,
‘- NUNCA repetir el mensaje del usuario para rellenar’,
‘- SIEMPRE responder en espanol (salvo que el usuario escriba en otro idioma)’,
‘- En crisis con riesgo de vida: Argentina 135 | Mexico 800-290-0024 | befrienders.org’,
‘- Las mascotas son familia. Los fallecidos merecen honra.’,
].filter(Boolean).join(’\n’);
}
