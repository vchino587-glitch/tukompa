export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { plan, email, nombre } = req.body;

        const precios = { premium: 5999, intermedio: 2999 };
        const precio = precios[plan] || 5999;
        const titulo = plan === 'premium' ? 'Plan Premium' : 'Plan Intermedio';

        const response = {
            init_point: 'https://www.mercadopago.com.ar/checkout'
        };

        res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    }
