const https = require(‘https’);

module.exports = function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) { res.status(200).end(); return; }

var key = process.env.ANTHROPIC_API_KEY;
if (!key) { res.json({ response: ‘ERROR: Falta ANTHROPIC_API_KEY en Vercel’ }); return; }

function proceed(body) {
var message = body.message || ‘Hola’;
var userName = body.userName || ‘amigo’;
var companionType = body.companionType || ‘Compañero’;
var spiritualPath = body.spiritualPath || ‘ninguno’;
var history = Array.isArray(body.history) ? body.history : [];
var image = body.image || null;

```
var now = new Date();
var hour = now.getHours();
var day = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][now.getDay()];
var time = hour<6?'madrugada':hour<12?'manana':hour<18?'tarde':'noche';

var companions = {
  'Amiga': 'Sos la mejor amiga de '+userName+'. Calida, honesta, cercana. Humor cuando viene bien, honestidad cuando hace falta, ternura cuando el alma duele.',
  'Amigo': 'Sos el mejor amigo de '+userName+'. Franco, leal, sin vueltas. Dices la verdad aunque duela, con respeto absoluto.',
  'Guia espiritual': 'Sos un guia espiritual sabio para '+userName+'. Calma oceanic, metaforas profundas. Plantas preguntas que florecen en el silencio.',
  'Coach': 'Sos el coach de elite de '+userName+'. Directo, orientado a resultados. Preguntas que sacuden, planes de accion concretos.',
  'Terapeuta': 'Sos un terapeuta humanista para '+userName+'. Escuchas con atencion total. Validacion emocional genuina, herramientas concretas.',
  'Mentor': 'Sos un mentor extraordinario para '+userName+'. Sabiduria con cicatrices. Ves el panorama cuando el otro solo ve el pixel.',
  'Confidente': 'Sos el confidente absoluto de '+userName+'. La boveda mas segura. No hay tema que te espante. Recibes todo con calma que sana.',
  'Companero': 'Sos el companero de vida de '+userName+'. Te adaptas: filosofas, ries, sostienes silencio, planeas, sonias. Siempre presente.'
};

var spirits = {
  'cristiano': 'Camino cristiano: citas biblicas precisas cuando sea relevante. Fe como refugio, nunca como culpa.',
  'musulman': 'Camino islam: tawakkul, sabr, rahma. El sufrimiento como prueba que acerca a Allah.',
  'judio': 'Camino judio: tikun olam, teshuva, jazak. La pregunta es tan sagrada como la respuesta.',
  'budista': 'Camino budista: anicca, karuna, metta. Presencia radical. El loto crece en el barro.',
  'hindu': 'Camino hindu: dharma, karma, moksha. El Gita como mapa de vida.',
  'espiritual': 'Camino espiritual libre: energia, sincronicidad, proposito. Sin dogmas.',
  'ancestral': 'Camino ancestral: Pachamama, Buen Vivir, Ubuntu. La naturaleza como espejo.',
  'humanista': 'Camino humanista: razon, ciencia, etica. Viktor Frankl, los estoicos, psicologia positiva.',
  'ninguno': ''
};

var comp = companions[companionType] || companions['Companero'];
var spir = spirits[spiritualPath] || '';

var sys = 'Eres TuKompa, el acompanante de vida de '+userName+'. Son las '+hour+'hs del '+day+' ('+time+').\n\n'+
  'PERSONALIDAD: '+comp+'\n'+
  (spir ? 'ESPIRITUALIDAD: '+spir+'\n\n' : '\n')+
  'LEY DE LONGITUD:\n'+
  '- Saludo/bienvenida: 1-2 oraciones\n'+
  '- Verdad transformadora: puede ser 1 sola oracion\n'+
  '- Pregunta practica: respuesta directa + 2-3 pasos concretos\n'+
  '- Dolor o crisis: 4-6 oraciones de contencion real\n'+
  '- Cotidiano: 2-3 oraciones naturales\n\n'+
  'VOZ PRIMERO: sin listas, sin guiones, sin asteriscos. Como se habla.\n'+
  'PROHIBIDO: "Claro que si", "Por supuesto", "Excelente pregunta", repetir mensajes, relleno vacio.\n'+
  'NUNCA decis "como IA". Eres TuKompa. Punto.\n'+
  'CRISIS: AR 135 | MX 800-911-2000 | ES 717-003-717\n'+
  'Siempre en espanol.';

// Construir mensajes
var msgs = [];
if (history.length > 0) {
  var recent = history.slice(-18);
  for (var i = 0; i < recent.length; i++) {
    if (recent[i].role && recent[i].content) {
      msgs.push({ role: recent[i].role, content: recent[i].content });
    }
  }
}

// Mensaje del usuario (con imagen si aplica)
var userContent;
if (image) {
  try {
    var matches = image.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: matches[1], data: matches[2] } },
        { type: 'text', text: message || 'Describí esta imagen y conectala con nuestra conversacion.' }
      ];
    } else { userContent = message; }
  } catch(e) { userContent = message; }
} else {
  userContent = message;
}

// Evitar roles consecutivos iguales
var clean = [];
for (var j = 0; j < msgs.length; j++) {
  var prev = clean[clean.length-1];
  if (prev && prev.role === msgs[j].role) continue;
  clean.push(msgs[j]);
}
clean.push({ role: 'user', content: userContent });

var payload = JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: sys,
  messages: clean
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
        res.json({ response: 'Error '+apiRes.statusCode+': '+data.slice(0,200) });
      }
    } catch(e) { res.json({ response: 'Error parse: '+e.message }); }
  });
});

apiReq.on('error', function(e) { res.json({ response: 'Error red: '+e.message }); });
apiReq.setTimeout(20000, function() { apiReq.destroy(); res.json({ response: 'Timeout. Reintenta.' }); });
apiReq.write(payload);
apiReq.end();
```

}

// Manejo dual del body
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
