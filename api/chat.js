const https = require(‘https’);

module.exports = async function handler(req, res) {
res.setHeader(‘Content-Type’, ‘text/plain; charset=utf-8’);

const key = process.env.ANTHROPIC_API_KEY;

if (!key) {
return res.status(200).send(‘ERROR: ANTHROPIC_API_KEY no existe en Vercel Environment Variables. Agregala en Settings > Environment Variables y hacé Redeploy.’);
}

res.write(’API Key encontrada: ’ + key.slice(0, 10) + ‘…\n\n’);
res.write(‘Haciendo llamada de prueba a Anthropic…\n\n’);

const body = JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 50,
messages: [{ role: ‘user’, content: ‘Di solo: FUNCIONA’ }]
});

try {
const result = await new Promise((resolve, reject) => {
const req2 = https.request({
hostname: ‘api.anthropic.com’,
path: ‘/v1/messages’,
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: key,
‘anthropic-version’: ‘2023-06-01’,
‘Content-Length’: Buffer.byteLength(body)
}
}, r => {
let data = ‘’;
r.on(‘data’, c => { data += c; });
r.on(‘end’, () => resolve({ status: r.statusCode, body: data }));
});
req2.on(‘error’, reject);
req2.setTimeout(20000, () => req2.destroy(new Error(‘Timeout’)));
req2.write(body);
req2.end();
});

```
res.write('Status Anthropic: ' + result.status + '\n\n');
res.write('Respuesta: ' + result.body + '\n');
return res.end();
```

} catch (e) {
return res.end(’ERROR al conectar con Anthropic: ’ + e.message);
}
};
