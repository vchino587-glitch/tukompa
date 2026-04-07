const https = require(‘https’);

module.exports = async function(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);
if (req.method === ‘OPTIONS’) return res.status(200).end();

const key = process.env.ANTHROPIC_API_KEY;
if (!key) return res.status(200).json({ response: ‘ERROR: Falta ANTHROPIC_API_KEY en Vercel’ });

const body = req.body || {};
const msgs = Array.isArray(body.messages) ? body.messages : [];

// Solo el ultimo mensaje del usuario, como string
let userMsg = ‘Hola’;
for (let i = msgs.length - 1; i >= 0; i–) {
if (msgs[i] && msgs[i].role === ‘user’ && typeof msgs[i].content === ‘string’) {
userMsg = msgs[i].content;
break;
}
}

const payload = JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 800,
messages: [{ role: ‘user’, content: userMsg }]
});

return new Promise(function(resolve) {
const apiReq = https.request({
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
let data = ‘’;
apiRes.on(‘data’, function(c) { data += c; });
apiRes.on(‘end’, function() {
if (apiRes.statusCode !== 200) {
res.status(200).json({ response: ’ERROR ’ + apiRes.statusCode + ’: ’ + data });
return resolve();
}
try {
const parsed = JSON.parse(data);
res.status(200).json({ response: parsed.content[0].text });
} catch(e) {
res.status(200).json({ response: ’ERROR parse: ’ + e.message + ’ | ’ + data.slice(0,100) });
}
resolve();
});
});
apiReq.on(‘error’, function(e) {
res.status(200).json({ response: ’ERROR red: ’ + e.message });
resolve();
});
apiReq.setTimeout(9000, function() {
res.status(200).json({ response: ‘ERROR timeout 9s - Vercel free tier limite’ });
apiReq.destroy();
resolve();
});
apiReq.write(payload);
apiReq.end();
});
};
