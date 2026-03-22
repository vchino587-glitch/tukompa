export default async function handler(req, res) {
    // Permitir GET para probar
    if (req.method === 'GET') {
        return res.status(200).json({ message: 'API funcionando correctamente' });
    }
    
    // Solo aceptar POST para pagos
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { plan, email, nombre } = req.body;

        // URLs de prueba
        const urls = {
            premium: 'https://www.mercadopago.com.ar/checkout?plan=premium',
            intermedio: 'https://www.mercadopago.com.ar/checkout?plan=intermedio'
        };

        const init_point = urls[plan] || urls.premium;

        res.status(200).json({ init_point });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
