const AnalyticsModel = require('../models/AnalyticsModel');
const axios = require('axios');

const analyticsController = {
    track: async (req, res) => {
        try {
            const { evento, data } = req.body;
            let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            
            // Limpiar IP de localhost si es necesario
            if (ip === '::1' || ip === '127.0.0.1') ip = '8.8.8.8'; // IP de prueba para desarrollo

            const userAgent = req.headers['user-agent'];

            // Intentar obtener Geo-IP (Opcional para no bloquear si falla el servicio externo)
            let geo = {};
            try {
                const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,isp`);
                if (response.data.status === 'success') {
                    geo = {
                        pais: response.data.country,
                        ciudad: response.data.city,
                        region: response.data.regionName,
                        proveedor: response.data.isp
                    };
                }
            } catch (e) {
                console.log('GeoIP Skip:', e.message);
            }

            await AnalyticsModel.registrarEvento({
                evento,
                ip,
                userAgent,
                data: { ...data, geo }
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Error tracking:', error);
            res.status(500).json({ success: false });
        }
    },

    verDetalle: async (req, res) => {
        try {
            const eventos = await AnalyticsModel.obtenerEventosRecientes(100);
            res.render('analytics/detalles', {
                eventos,
                title: 'Detalle de Analítica',
                pagina: 'marketing'
            });
        } catch (error) {
            console.error('Error verDetalle:', error);
            res.status(500).send('Error al cargar detalles');
        }
    }
};

module.exports = analyticsController;
