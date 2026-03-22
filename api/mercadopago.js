import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { plan, email, nombre } = req.body;
        const precio = plan === 'premium' ? 5999 : 2999;
        const titulo = plan === 'premium' ? 'Plan Premium' : 'Plan Intermedio';

        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const preference = new Preference(client);

        const response = await preference.create({
            body: {
                items: [{ title: `TuKompa - ${titulo}`, quantity: 1, unit_price: precio, currency_id: 'ARS' }],
                payer: { email, name: nombre },
                back_urls: { success: 'https://tukompa.vercel.app', failure: 'https://tukompa.vercel.app' },
                auto_return: 'approved'
            }
        });

        res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
                  }
