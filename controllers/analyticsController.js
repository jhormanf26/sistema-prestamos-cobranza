const AnalyticsModel = require('../models/AnalyticsModel');
const axios = require('axios');

const analyticsController = {
    track: async (req, res) => {
        try {
            const { evento, data } = req.body;
            
            // Obtener IP Real detrás de Proxy
            let ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
            if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
            
            // Limpiar IP de localhost para pruebas
            if (ip === '::1' || ip === '127.0.0.1') ip = '8.8.8.8'; 

            const userAgent = req.headers['user-agent'];
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
            const vista = req.query.vista || 'eventos'; // 'eventos' o 'visitantes'
            
            if (vista === 'visitantes') {
                const visitantes = await AnalyticsModel.obtenerVisitantesUnicos();
                res.render('analytics/visitantes', {
                    visitantes,
                    title: 'Visitantes Únicos',
                    pagina: 'marketing'
                });
            } else {
                const eventos = await AnalyticsModel.obtenerEventosRecientes(100);
                res.render('analytics/detalles', {
                    eventos,
                    title: 'Detalle de Analítica',
                    pagina: 'marketing'
                });
            }
        } catch (error) {
            console.error('Error verDetalle:', error);
            res.status(500).send('Error al cargar detalles');
        }
    },

    verVisitante: async (req, res) => {
        try {
            const visitorId = req.params.id;
            const eventos = await AnalyticsModel.obtenerEventosPorVisitante(visitorId);
            
            res.render('analytics/visitante_detalle', {
                eventos,
                visitorId,
                title: 'Línea de Tiempo del Visitante',
                pagina: 'marketing'
            });
        } catch (error) {
            console.error('Error verVisitante:', error);
            res.status(500).send('Error al cargar línea de tiempo');
        }
    }
};

module.exports = analyticsController;
