const AnalyticsModel = require('../models/AnalyticsModel');
const axios = require('axios');

const analyticsController = {
    track: async (req, res) => {
        try {
            const { evento, data, metadata } = req.body;
            
            // 1. Obtener IP Real detrás de Proxy
            let ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
            if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
            if (ip === '::1' || ip === '127.0.0.1') ip = '8.8.8.8'; 

            const userAgent = req.headers['user-agent'] || '';
            
            // 2. Detección de Bots (Filtro de Tráfico)
            const botKeywords = ['googlebot', 'bingbot', 'yandexbot', 'facebookexternalhit', 'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'quora link preview', 'showyoubot', 'outbrain', 'pinterest/0.', 'developers.google.com/+/web/snippet', 'slackbot', 'vkShare', 'W3C_Validator', 'redditbot', 'Applebot'];
            const isBot = botKeywords.some(keyword => userAgent.toLowerCase().includes(keyword.toLowerCase()));

            // 3. Obtener Geo-IP (Solo si no es Bot para ahorrar API)
            let geo = {};
            if (!isBot) {
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
            }

            // 4. Registrar Evento con flag de Bot
            await AnalyticsModel.registrarEvento({
                evento,
                ip,
                userAgent,
                data: { ...data, ...metadata, geo, isBot }
            });

            // 5. Enviar Notificación Push si es evento valioso
            if (!isBot && (evento === 'page_view' || evento === 'simulacion' || evento === 'solicitud_prestamo')) {
                const { sendPushToAdmins } = require('../utils/pushService');
                let titulo = 'Nuevo Evento en Web Promocional';
                let msj = `Se registró un nuevo evento: ${evento}`;
                
                if (evento === 'simulacion') {
                    titulo = '💸 Nueva Simulación';
                    msj = `Alguien simuló un préstamo en tu Landing Page.`;
                } else if (evento === 'page_view') {
                    titulo = '👀 Nueva Visita';
                    msj = `Tienes un nuevo visitante${geo.ciudad ? ' desde ' + geo.ciudad : ''}.`;
                } else if (evento === 'solicitud_prestamo') {
                    titulo = '🔥 ¡Nuevo Lead!';
                    msj = `Alguien hizo clic en solicitar préstamo.`;
                }

                // Enviar la notificación en background solo a administradores
                sendPushToAdmins({
                    title: titulo,
                    body: msj,
                    icon: '/img/logo.png',
                    url: '/promocion/detalle'
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error tracking:', error);
            res.status(500).json({ success: false });
        }
    },

    verDetalle: async (req, res) => {
        try {
            const vista = req.query.vista || 'eventos';
            const incluirBots = req.query.bots === '1'; // Opción para ver bots si se desea
            
            if (vista === 'visitantes') {
                const visitantes = await AnalyticsModel.obtenerVisitantesUnicos(incluirBots);
                res.render('analytics/visitantes', {
                    visitantes,
                    incluirBots,
                    title: 'Visitantes Únicos',
                    pagina: 'marketing'
                });
            } else {
                const eventos = await AnalyticsModel.obtenerEventosRecientes(200, incluirBots);
                res.render('analytics/detalles', {
                    eventos,
                    incluirBots,
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
                title: 'Línea de Tiempo',
                pagina: 'marketing'
            });
        } catch (error) {
            console.error('Error verVisitante:', error);
            res.status(500).send('Error al cargar línea de tiempo');
        }
    },

    exportarCSV: async (req, res) => {
        try {
            const eventos = await AnalyticsModel.obtenerEventosRecientes(1000, false); // Solo humanos para el reporte
            
            let csv = 'Fecha;Evento;IP;Ubicacion;Dispositivo;Detalles\n';
            eventos.forEach(e => {
                const d = (typeof e.data === 'string' && e.data !== '[object Object]') ? JSON.parse(e.data) : (e.data || {});
                const geo = d.geo || {};
                const ubicacion = `${geo.ciudad || ''}, ${geo.pais || ''}`.replace(';', ',');
                const fecha = new Date(e.created_at).toLocaleString();
                
                csv += `${fecha};${e.evento};${e.ip};${ubicacion};${e.user_agent ? e.user_agent.substring(0, 50).replace(';', ',') : ''};${JSON.stringify(d).replace(/;/g, ',')}\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte_marketing.csv');
            res.status(200).send('\uFEFF' + csv); // BOM para que Excel detecte acentos
        } catch (error) {
            console.error('Error exportarCSV:', error);
            res.status(500).send('Error al exportar');
        }
    },

    socialProof: async (req, res) => {
        try {
            const eventos = await AnalyticsModel.obtenerEventosSocialProof();
            res.json(eventos);
        } catch (error) {
            console.error('Error socialProof:', error);
            res.status(500).json([]);
        }
    }
};

module.exports = analyticsController;
