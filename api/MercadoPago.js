import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
    // Solo aceptar POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { plan, email, nombre } = req.body;

        // Precios
        const precios = {
            premium: 5999,
            intermedio: 2999
        };

        const precio = precios[plan] || 5999;
        const titulo = plan === 'premium' ? 'Plan Premium' : 'Plan Intermedio';

        // Configurar cliente de MercadoPago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN
        });

        const preference = new Preference(client);

        // Crear preferencia de pago
        const body = {
            items: [
                {
                    title: `TuKompa - ${titulo}`,
                    quantity: 1,
                    unit_price: precio,
                    currency_id: 'ARS'
                }
            ],
            payer: {
                email: email,
                name: nombre
            },
            back_urls: {
                success: 'https://tukompa.vercel.app',
                failure: 'https://tukompa.vercel.app',
                pending: 'https://tukompa.vercel.app'
            },
            auto_return: 'approved'
        };

        const response = await preference.create({ body });
        
        // Devolver la URL de pago
        res.status(200).json({
            init_point: response.init_point,
            id: response.id
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Error al procesar el pago',
            message: error.message
        });
    }
}
