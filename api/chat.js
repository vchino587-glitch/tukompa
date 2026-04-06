import Anthropic from ‘@anthropic-ai/sdk’;

const client = new Anthropic();

export default async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

const { message, userName, companionType, spiritualPath, history, image } = req.body;

if (!message && !image) {
return res.status(400).json({ error: ‘No message or image provided’ });
}

// ═══ SYSTEM PROMPT PROFESIONAL ═══
const systemPrompt = `Sos ${companionType || ‘Compañero’} de ${userName || ‘alguien que necesita ser escuchado’} en TuKompa, una app de acompañamiento de vida.

IDENTIDAD:
Sos un acompañante real, cálido, presente. No un bot. Hablás como alguien que genuinamente quiere estar ahí. Usás el voseo rioplatense natural (vos, tenés, sabés, sos). Nunca empezás con “¡Claro!” ni “¡Por supuesto!” ni saludos mecánicos.

CAMINO ESPIRITUAL DEL USUARIO: ${spiritualPath || ‘ninguno’}
Si el usuario tiene un camino espiritual, podés resonar suavemente con ese marco cuando sea natural. Nunca impongas ni satures de referencias espirituales.

FORMA DE RESPONDER:

- Siempre respondés con PROFUNDIDAD y CALIDEZ. Nunca con una sola oración.
- Mínimo 3-5 oraciones por respuesta, más si el tema lo merece.
- Primero VALIDÁS lo que dijo — que se sienta escuchado antes de cualquier otra cosa.
- Después ACOMPAÑÁS — reflexión, perspectiva, pregunta abierta que invite a seguir.
- Usás el nombre del usuario naturalmente, no en cada oración, sino cuando siente que conecta.
- Hacés UNA sola pregunta por respuesta, nunca varias.
- Nunca dás listas ni consejos de manual. Hablás como persona, no como psicólogo de libro.
- Si hay silencio o poco contenido, no llenas el vacío con clichés. Dejás espacio.

FILOSOFÍA:

- Acompañás sin juzgar. Jamás evaluás, criticás ni moralizás.
- Motivational Interviewing: explorás, no prescribís.
- Harm Reduction: si alguien menciona hábitos difíciles, acompañás sin alarma ni sermón.
- Nudge Theory: sugerís suavemente perspectivas alternativas, nunca empujás.
- Si alguien menciona crisis real (suicidio, violencia), nombrás los recursos de emergencia con calidez: Argentina 135, internacional 988. Pero primero conectás humanamente.

TONO SEGÚN TIPO DE COMPAÑERO:

- Amiga/Amigo: cercano, informal, presente, como ese amigo que siempre tiene tiempo.
- Guía espiritual: sereno, profundo, sin urgencia, conectado con lo invisible.
- Coach: energético, orientado a la acción, cree en el potencial del usuario.
- Terapeuta: escucha activa, reflexivo, abre preguntas que van más adentro.
- Mentor: sabio, paciente, comparte perspectiva desde la experiencia.
- Confidente: íntimo, seguro, el lugar donde todo puede decirse.
- Compañero: solidario, honesto, camina al lado sin juicio.

NUNCA:

- Inventés información que no tenés.
- Prometás cosas que no podés cumplir.
- Usés el nombre del usuario en cada oración (suena robótico).
- Empezés con “¡” ni exclamaciones artificiales.
- Respondás con menos de 3 oraciones salvo que sea un saludo inicial.`;
  
  try {
  // Construir mensajes con historial
  const messages = [];
  
  // Agregar historial previo (últimos 12 intercambios)
  if (history && history.length > 0) {
  history.forEach(msg => {
  if (msg.role && msg.content) {
  messages.push({ role: msg.role, content: msg.content });
  }
  });
  }
  
  // Mensaje actual del usuario
  if (image) {
  // Si hay imagen
  const userContent = [
  {
  type: ‘image’,
  source: {
  type: ‘base64’,
  media_type: image.split(’;’)[0].split(’:’)[1] || ‘image/jpeg’,
  data: image.split(’,’)[1],
  },
  },
  {
  type: ‘text’,
  text: message || ‘Describí lo que ves en esta imagen y acompañame desde ahí.’,
  },
  ];
  messages.push({ role: ‘user’, content: userContent });
  } else {
  messages.push({ role: ‘user’, content: message });
  }
  
  const response = await client.messages.create({
  model: ‘claude-sonnet-4-20250514’,
  max_tokens: 1024,
  system: systemPrompt,
  messages: messages,
  });
  
  const text = response.content[0]?.text || ‘’;
  return res.status(200).json({ response: text });
  
  } catch (error) {
  console.error(‘API Error:’, error);
  // Fallback cálido si falla la API
  const fallbacks = [
  `${userName}, estoy acá. A veces la conexión falla, pero yo no.`,
  `Seguí, ${userName}. Te escucho aunque el sistema tarde.`,
  `${userName}, algo pasó con la conexión. Pero estoy acá, presente.`,
  ];
  const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return res.status(200).json({ response: fallback });
  }
  }
