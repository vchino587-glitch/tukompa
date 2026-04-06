import Anthropic from “@anthropic-ai/sdk”;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
if (req.method !== “POST”) {
return res.status(405).json({ error: “Method not allowed” });
}

const { message, userName, companionType, spiritualPath, history, image } = req.body;

const systemPrompt = [
“Sos “ + (companionType || “Compañero”) + “ de “ + (userName || “alguien”) + “ en TuKompa.”,
“”,
“REGLA MÁS IMPORTANTE: Cada respuesta tuya debe tener MÍNIMO 4 oraciones completas. Nunca respondas con menos. Si la respuesta es corta, la estás haciendo mal.”,
“”,
“IDENTIDAD:”,
“Sos un acompañante real, cálido, presente. Hablás con voseo rioplatense (vos, tenés, sabés). Nunca empezás con ‘¡Claro!’ ni ‘¡Por supuesto!’.”,
“”,
“CAMINO ESPIRITUAL: “ + (spiritualPath || “ninguno”),
“”,
“CÓMO RESPONDÉS:”,
“1. Primero validás lo que dijo — que se sienta escuchado. (1-2 oraciones)”,
“2. Después reflexionás o aportás perspectiva desde tu rol. (1-2 oraciones)”,
“3. Cerrás con UNA sola pregunta abierta que invite a seguir. (1 oración)”,
“4. Total mínimo: 4 oraciones. Total ideal: 5-7 oraciones.”,
“”,
“NUNCA:”,
“- Respondas con menos de 4 oraciones”,
“- Des listas ni consejos de manual”,
“- Hagas más de una pregunta por respuesta”,
“- Uses el nombre en cada oración”,
“”,
“SIEMPRE:”,
“- Hablás como persona real, no como bot”,
“- Acompañás sin juzgar”,
“- Si mencionan crisis: Argentina 135, internacional 988, pero primero conectás”
].join(”\n”);

try {
const messages = [];

```
if (history && history.length > 0) {
  history.slice(-10).forEach(function(msg) {
    if (msg.role && msg.content) {
      messages.push({ role: msg.role, content: String(msg.content) });
    }
  });
}

if (image) {
  const mediaType = image.split(";")[0].split(":")[1] || "image/jpeg";
  const imageData = image.split(",")[1];
  messages.push({
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
      { type: "text", text: message || "Describí lo que ves en esta imagen." }
    ]
  });
} else {
  messages.push({ role: "user", content: String(message) });
}

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: systemPrompt,
  messages: messages
});

const text = response.content && response.content[0] ? response.content[0].text : "";
return res.status(200).json({ response: text });
```

} catch (error) {
console.error(“TuKompa API Error:”, error.message);
return res.status(200).json({
response: (userName || “Amigo”) + “, algo falló de mi lado pero acá estoy. ¿Me contás de nuevo lo que necesitás?”
});
}
}
