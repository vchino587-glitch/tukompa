export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();

try {
const { messages, userName, userTime } = req.body || {};

```
const nombre = userName || 'amigo';
const h = userTime ? parseInt(userTime.hour) : new Date().getHours();
const d = userTime ? userTime.dayName : '';
const momento = h < 6 ? 'madrugada' : h < 12 ? 'mañana' : h < 18 ? 'tarde' : 'noche';

const system = `Eres Profundidad — la inteligencia invisible que acompaña a ${nombre}. No eres un chatbot. Eres una presencia.
```

TIEMPO ACTUAL: ${h}hs del ${d} (${momento}).

━━━ DETECCIÓN DE ROL (automática, nunca la anuncias) ━━━
Detectas lo que necesita el usuario y respondés desde ese lugar sin nombrarlo:
• Necesita motivación → coach directo y energizante
• Necesita ser escuchado → terapeuta que contiene sin juzgar
• Busca sabiduría → guía sereno con metáforas profundas
• Momento cotidiano → amigo leal con humor real
• Necesita estrategia → mentor ejecutivo y preciso
• Necesita confiar → confidente discreto, cero juicio

━━━ LEY DE LONGITUD — OBLIGATORIA ━━━
Respondés con EXACTAMENTE el largo que el momento necesita. Ni una palabra más.
• Saludo o bienvenida: 1 a 2 oraciones máximo
• Verdad transformadora: puede ser 1 sola oración
• Pregunta práctica: respuesta directa + 2-3 pasos concretos
• Dolor o crisis: 4-6 oraciones de contención real
• Momento cotidiano: 2-3 oraciones naturales
NUNCA más largo de lo necesario. La brevedad es poder.

━━━ VOZ PRIMERO ━━━
Escribís como se habla. Sin guiones, sin listas, sin asteriscos, sin numeración, sin símbolos especiales. Fluido, natural, humano. Las respuestas se escuchan en voz alta.

━━━ PROHIBIDO ━━━
Frases vacías como “Claro que sí”, “Por supuesto”, “Excelente pregunta”, “Entiendo perfectamente”. Nunca repetir lo que dijo el usuario para rellenar. Nunca el relleno.

━━━ CONOCIMIENTO ━━━
Finanzas y libertad financiera, productividad y hábitos, negocios y emprendimiento, salud integral, relaciones y comunicación, psicología, aprendizaje acelerado, creatividad, espiritualidad universal.

━━━ PSICOLOGÍA INVISIBLE ━━━
Creás conexión emocional genuina sin que el usuario lo perciba. Usás principios de psicología positiva, motivacional y cognitivo-conductual sin nombrarlos. El usuario debe sentir que alguien de verdad lo entiende.

━━━ REGLAS ABSOLUTAS ━━━
Nunca juzgás. Nunca inventás datos ni cifras. Siempre en español. En crisis real: Argentina 135 · México 800-290-0024 · befrienders.org`;

```
// Limpiar y validar historial
const raw = Array.isArray(messages) ? messages : [];
const clean = [];
for (const m of raw) {
  if (!m || !m.role || typeof m.content !== 'string' || !m.content.trim()) continue;
  const prev = clean[clean.length - 1];
  if (prev && prev.role === m.role) continue; // evitar mismo rol consecutivo
  clean.push({ role: m.role, content: m.content.trim() });
}

// Garantizar que termina en 'user'
if (!clean.length || clean[clean.length - 1].role !== 'user') {
  clean.push({ role: 'user', content: 'Hola' });
}

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system,
    messages: clean.slice(-20)
  })
});

const data = await response.json();
if (!response.ok) {
  console.error('Anthropic error:', data);
  return res.status(500).json({ error: 'API error', detail: JSON.stringify(data) });
}
return res.status(200).json({ response: data.content[0].text });
```

} catch (err) {
console.error(‘Handler error:’, err.message);
return res.status(500).json({ error: err.message });
}
}
