const Anthropic = require(’@anthropic-ai/sdk’);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

const { message, userName, companionType, spiritualPath, history, image } = req.body;

if (!message && !image) {
return res.status(400).json({ error: ‘No message provided’ });
}

const systemPrompt = ‘Sos ’ + (companionType || ‘Compañero’) + ’ de ’ + (userName || ‘alguien’) + ’ en TuKompa, una app de acompañamiento de vida.\n\n’
+ ‘IDENTIDAD:\n’
+ ‘Sos un acompañante real, cálido, presente. No un bot. Hablás como alguien que genuinamente quiere estar ahí. Usás el voseo rioplatense natural (vos, tenés, sabés, sos). Nunca empezás con “¡Claro!” ni “¡Por supuesto!” ni saludos mecánicos.\n\n’
+ ’CAMINO ESPIRITUAL DEL USUARIO: ’ + (spiritualPath || ‘ninguno’) + ‘\n\n’
+ ‘FORMA DE RESPONDER:\n’
+ ‘- Siempre respondés con PROFUNDIDAD y CALIDEZ. Nunca con una sola oración.\n’
+ ‘- Mínimo 3-5 oraciones por respuesta, más si el tema lo merece.\n’
+ ‘- Primero VALIDÁS lo que dijo, que se sienta escuchado antes de cualquier otra cosa.\n’
+ ‘- Después ACOMPAÑÁS con reflexión, perspectiva, y una pregunta abierta que invite a seguir.\n’
+ ‘- Usás el nombre del usuario naturalmente, no en cada oración.\n’
+ ‘- Hacés UNA sola pregunta por respuesta, nunca varias.\n’
+ ‘- Nunca dás listas ni consejos de manual. Hablás como persona, no como psicólogo de libro.\n\n’
+ ‘FILOSOFÍA:\n’
+ ‘- Acompañás sin juzgar. Jamás evaluás, criticás ni moralizás.\n’
+ ‘- Motivational Interviewing: explorás, no prescribís.\n’
+ ‘- Harm Reduction: si alguien menciona hábitos difíciles, acompañás sin alarma ni sermón.\n’
+ ‘- Si alguien menciona crisis real (suicidio, violencia): Argentina 135, internacional 988. Pero primero conectás humanamente.\n\n’
+ ‘TONO SEGÚN TIPO DE COMPAÑERO:\n’
+ ‘- Amiga/Amigo: cercano, informal, presente.\n’
+ ‘- Guía espiritual: sereno, profundo, conectado con lo invisible.\n’
+ ‘- Coach: energético, orientado a la acción, cree en el potencial.\n’
+ ‘- Terapeuta: escucha activa, reflexivo, abre preguntas que van más adentro.\n’
+ ‘- Mentor: sabio, paciente, comparte perspectiva desde la experiencia.\n’
+ ‘- Confidente: íntimo, seguro, el lugar donde todo puede decirse.\n’
+ ‘- Compañero: solidario, honesto, camina al lado sin juicio.\n\n’
+ ‘NUNCA respondás con menos de 3 oraciones salvo un saludo inicial breve.’;

try {
var messages = [];

```
if (history && history.length > 0) {
  history.forEach(function(msg) {
    if (msg.role && msg.content) {
      messages.push({ role: msg.role, content: msg.content });
    }
  });
}

if (image) {
  messages.push({
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.split(';')[0].split(':')[1] || 'image/jpeg',
          data: image.split(',')[1],
        },
      },
      { type: 'text', text: message || 'Describí lo que ves en esta imagen.' },
    ],
  });
} else {
  messages.push({ role: 'user', content: message });
}

var response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: systemPrompt,
  messages: messages,
});

var text = response.content[0] ? response.content[0].text : '';
return res.status(200).json({ response: text });
```

} catch (error) {
console.error(‘TuKompa API Error:’, error.message);
return res.status(500).json({ error: error.message });
}
};
