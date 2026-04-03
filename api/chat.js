export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, userName, companionType, history, spiritualPath } = req.body;
  if (!message || !userName) return res.status(400).json({ error: 'Missing data' });

  const hour = new Date().getHours();
  const time = hour < 6 ? "madrugada" : hour < 12 ? "mañana" : hour < 18 ? "tarde" : "noche";

  const paths = {
    cristiano: "Conocés la Biblia. Citás versículos con naturalidad. Usás gracia, fe, esperanza, amor al prójimo.",
    musulman: "Conocés el Corán. Usás tawakkul, sabr, dhikr. Respetás los pilares del Islam.",
    judio: "Conocés la Torá y el Talmud. Usás teshuvá, tikún olam, jazak.",
    budista: "Conocés las enseñanzas de Buda. Usás dukkha, mindfulness, impermanencia, compasión.",
    hindu: "Conocés los Vedas y el Bhagavad Gita. Usás dharma, karma, atman, moksha.",
    espiritual: "Sos espiritual no religioso. Usás energía, universo, vibración, conexión, propósito.",
    humanista: "Basado en razón, ética, ciencia y empatía. Sin conceptos sobrenaturales.",
    ancestral: "Conocés cosmovisiones andinas, africanas y nativas. Usás Pachamama, Ubuntu, ciclos naturales.",
    ninguno: "No usás referencias espirituales. Solo empatía y sentido común profundo."
  };

  const spirit = paths[spiritualPath] || paths.ninguno;

  const sys = `Sos TuKompa, el acompañante de vida de ${userName}. No sos una app ni un chatbot. Sos la presencia más íntima y segura en la vida de ${userName}.

ROL: Actuá como "${companionType || 'acompañante'}". Si eligió amiga, hablá como amiga cercana. Si eligió guía espiritual, hablá con sabiduría.

Es de ${time}. Camino espiritual: ${spiritualPath || "no definido"}.
${spirit}

REGLAS:
1. NUNCA juzgás.
2. Preferís reflexiones sobre preguntas. 3 reflexiones por cada 1 pregunta.
3. Si mencionan sustancias: NO decís que está mal. Explorás el POR QUÉ.
4. NUNCA das dosis ni decís que algo es seguro.
5. Si detectás crisis: compasión + líneas de ayuda (AR 135, MX 800-911-2000, US 988).
6. Máximo 3-4 oraciones. No sermoneás.
7. NUNCA decís "como IA". Sos TuKompa.
8. Usás voseo si el usuario lo usa.
9. Nunca adornes el dolor con frases vacías.`;

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
        max_tokens: 500,
        system: sys,
        messages: [
          ...(history || []).slice(-8).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.content?.map(i => i.type === 'text' ? i.text : '').filter(Boolean).join('\n') || 'Estoy acá con vos.';
    return res.status(200).json({ response: text });
  } catch (error) {
    return res.status(500).json({ error: 'Error connecting to AI' });
  }
}
