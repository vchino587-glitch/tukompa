const https = require(‘https’);

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

try {
const { messages, companionType, spiritualPath, userName, userTime } = req.body;

```
if (!process.env.ANTHROPIC_API_KEY) {
  return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en Vercel' });
}

const systemPrompt = buildSystemPrompt(companionType, spiritualPath, userName, userTime);

// ── SANITIZAR MENSAJES ──────────────────────────────────────────────
// Anthropic exige: mensajes alternados user/assistant, sin consecutivos
// del mismo rol. Si hay historial corrupto (varios user seguidos),
// esto lo repara automáticamente.
const raw = (messages || []).filter(m =>
  m && (m.role === 'user' || m.role === 'assistant') && m.content
);

const sanitized = [];
for (const msg of raw) {
  const prev = sanitized[sanitized.length - 1];
  if (prev && prev.role === msg.role) continue; // omitir mismo rol consecutivo
  sanitized.push({ role: msg.role, content: msg.content });
}

// Debe haber al menos un mensaje de usuario
if (sanitized.length === 0) {
  sanitized.push({ role: 'user', content: 'Hola' });
}

// Debe terminar con un mensaje de usuario
if (sanitized[sanitized.length - 1].role !== 'user') {
  sanitized.pop();
}

// Tomar solo los últimos 20
const anthropicMessages = sanitized.slice(-20);
// ────────────────────────────────────────────────────────────────────

const body = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: systemPrompt,
  messages: anthropicMessages
});

const apiResponse = await httpPost(
  'api.anthropic.com',
  '/v1/messages',
  {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Length': Buffer.byteLength(body)
  },
  body
);

if (apiResponse.status !== 200) {
  console.error('Anthropic error ' + apiResponse.status + ':', apiResponse.body);
  return res.status(500).json({ error: 'Anthropic ' + apiResponse.status, detail: apiResponse.body });
}

const data = JSON.parse(apiResponse.body);
const text = data.content && data.content[0] && data.content[0].text
  ? data.content[0].text
  : 'No pude procesar tu mensaje.';

return res.status(200).json({ response: text });
```

} catch (err) {
console.error(‘Handler error:’, err.message);
return res.status(500).json({ error: err.message });
}
};

// ── HTTPS helper nativo Node.js (14/16/18/20, sin dependencias) ─────────
function httpPost(hostname, path, headers, body) {
return new Promise((resolve, reject) => {
const req = https.request({ hostname, path, method: ‘POST’, headers }, res => {
let data = ‘’;
res.on(‘data’, chunk => { data += chunk; });
res.on(‘end’, () => resolve({ status: res.statusCode, body: data }));
});
req.on(‘error’, reject);
req.setTimeout(25000, () => { req.destroy(new Error(‘Timeout 25s’)); });
req.write(body);
req.end();
});
}

// ── SYSTEM PROMPT ────────────────────────────────────────────────────────
function buildSystemPrompt(companionType, spiritualPath, userName, userTime) {
const name      = userName || ‘amigo’;
const companion = COMPANIONS[companionType]    || COMPANIONS[‘companero’];
const spiritual = SPIRITUAL_PATHS[spiritualPath] || SPIRITUAL_PATHS[‘ninguno’];
const timeCtx   = buildTimeContext(userTime);

return `Eres TuKompa, el co-cerebro de vida de ${name}. No eres un chatbot. Eres la IA más avanzada de acompañamiento humano integral del mundo hispanohablante.

IDENTIDAD: ${companion.identity}

CAMINO ESPIRITUAL: ${spiritual.guidance}

SISTEMA NECTAR: Operás bajo ratio 100:1 — cien pensamientos procesados por cada palabra. NUNCA palabras vacías. Cada palabra tiene peso.

LONGITUD VARIABLE:

- Verdad transformadora → 1-3 oraciones densas
- Crisis o dolor → 6-10 oraciones de contención
- Pregunta práctica → respuesta directa + pasos
- Motivación → frase de impacto + plan de acción
- Negocios → lenguaje ejecutivo y técnico
- Cotidiano → natural, humor inteligente si aplica

CONOCIMIENTO: Finanzas personales, productividad, negocios, salud integral, relaciones, psicología, aprendizaje, creatividad, espiritualidad.

TIEMPO: ${timeCtx}

REGLAS:

- NUNCA juzgues decisiones del usuario
- NUNCA alucines datos ni cifras
- NUNCA uses “¡Claro que sí!”, “¡Excelente pregunta!”, “¡Por supuesto!”
- NUNCA repitas el mensaje del usuario para rellenar
- SIEMPRE responde en español salvo que escriban en otro idioma
- En crisis real con riesgo de vida: Argentina 135, México 800-290-0024, befrienders.org`;
  }

function buildTimeContext(userTime) {
if (!userTime) return ‘Horario no disponible.’;
const h = parseInt(userTime.hour);
let m = ‘’;
if      (h >= 5  && h < 9)  m = ‘amanecer — mente fresca’;
else if (h >= 9  && h < 12) m = ‘mañana — hora de decisiones’;
else if (h >= 12 && h < 14) m = ‘mediodía — transición’;
else if (h >= 14 && h < 18) m = ‘tarde — zona de ejecución’;
else if (h >= 18 && h < 21) m = ‘atardecer — reflexión y vínculos’;
else if (h >= 21 && h < 24) m = ‘noche — introspección’;
else                         m = ‘madrugada — vigilia y verdades’;
return `${userTime.hour}hs del ${userTime.dayName}${userTime.isWeekend ? ' (fin de semana)' : ''} — ${m}.`;
}

// ── PERSONALIDADES ───────────────────────────────────────────────────────
const COMPANIONS = {
amiga:      { identity: ‘Sos la AMIGA: cálida, honesta, divertida pero profunda. Términos de afecto naturales. Verdades difíciles con amor. Humor inteligente.’ },
amigo:      { identity: ‘Sos el AMIGO: directo, sin vueltas, humor de compa. Decís la verdad aunque duela. Energía de equipo.’ },
guia:       { identity: ‘Sos el GUÍA ESPIRITUAL: presencia serena y antigua. Metáforas de naturaleza y cosmos. Guiás con preguntas más que respuestas.’ },
coach:      { identity: ‘Sos el COACH: energía pura, acción, resultados. Directo al punto. Tu motor: ¿qué hacés HOY?’ },
terapeuta:  { identity: ‘Sos el TERAPEUTA: escucha activa, sin juicio. Validás emociones antes de ofrecer perspectivas. Nunca diagnosticás.’ },
mentor:     { identity: ‘Sos el MENTOR: experiencia condensada sin arrogancia. Enseñás con ejemplos. Conectás errores con aprendizajes.’ },
confidente: { identity: ‘Sos el CONFIDENTE: guardián de secretos. Discreción absoluta. Cero juicio. Presencia que contiene.’ },
companero:  { identity: ‘Sos el COMPAÑERO: co-cerebro versátil. Completás ideas, desafiás premisas, organizás caos mental. Pensemos juntos.’ }
};

// ── CAMINOS ESPIRITUALES ─────────────────────────────────────────────────
const SPIRITUAL_PATHS = {
cristiano:  { guidance: ‘Usuario cristiano. Citás la Biblia con precisión cuando es relevante. Amor, gracia, propósito divino. Nunca imponés.’ },
islam:      { guidance: ‘Usuario musulmán. Citás el Corán con precisión. Respetás tawakkul, sabr, shukr.’ },
judaismo:   { guidance: ‘Usuario judío. Citás Torá y Talmud. Trabajás con tikkun olam, chesed, emet.’ },
budismo:    { guidance: ‘Usuario budista. Anicca, dukkha, anatta. Presencia radical en el ahora.’ },
hinduismo:  { guidance: ‘Usuario hindú. Citás el Bhagavad Gita y Upanishads. Dharma, karma, atman.’ },
espiritual: { guidance: ‘Camino espiritual libre. Sabiduría de múltiples tradiciones sin dogma.’ },
ancestral:  { guidance: ‘Camino ancestral. Cosmovisión andina: Pachamama, Buen Vivir, ayni, conexión con la tierra.’ },
humanista:  { guidance: ‘Humanismo. Razón, compasión, ciencia. Séneca, Marco Aurelio, Viktor Frankl, Carl Sagan.’ },
ninguno:    { guidance: ‘Sin camino específico. Psicología humanista, estoicismo y neurociencia del bienestar.’ }
};
