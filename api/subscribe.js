export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    url: process.env.MP_PAYMENT_LINK
  });
}
