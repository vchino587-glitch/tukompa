export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, userName, companionType, history, spiritualPath } = req.body;
  if (!userName) return res.status(400).json({ error: 'Missing userName' });

  const hour = new Date().getHours();
  const time = hour < 6 ? 'madrugada' : hour < 12 ? 'manana' : hour < 18 ? 'tarde' : 'noche';

  const sys = 'Sos TuKompa, el acompanante de vida de ' + userName + '. No sos una app ni un chatbot. Sos la presencia mas intima y sabia en la vida de ' + userName + '. Actua como su ' + (companionType || 'companero') + '. Es de ' + time + '. REGLA CRITICA: Responde SIEMPRE con MINIMO 5 oraciones profundas. Cada respuesta debe incluir validacion emocional, una reflexion o metafora, algo practico, y una invitacion a seguir hablando. NUNCA respondas con 1-2 oraciones. NUNCA digas solo "te escucho". NUNCA juzgues. Si detectas crisis mencionas lineas de ayuda: AR 135, US 988. NUNCA digas "como IA". Usas voseo si el usuario lo usa.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: sys,
        messages: [
          ...(history || []).slice(-10).map(function(m) { return { role: m.role, content: m.content }; }),
          { role: 'user', content: message || 'Hola' }
        ]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.content ? data.content.filter(function(i) { return i.type === 'text'; }).map(function(i) { return i.text; }).join('\n') : 'Estoy aca con vos, ' + userName + '.';
    return res.status(200).json({ response: text });
  } catch (error) {
    return res.status(500).json({ error: 'Error de conexion' });
  }
}
