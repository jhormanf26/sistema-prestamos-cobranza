const db = require('../config/db');

class AnalyticsModel {
    static async registrarEvento(datos) {
        const { evento, ip, userAgent, data } = datos;
        const query = 'INSERT INTO web_analytics (evento, ip, user_agent, data) VALUES (?, ?, ?, ?)';
        return await db.query(query, [evento, ip, userAgent, JSON.stringify(data)]);
    }

    static async obtenerResumen() {
        const [visitas] = await db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'visita' AND JSON_EXTRACT(data, '$.isBot') = false");
        const [clics] = await db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'click_solicitar'");
        const [hoy] = await db.query("SELECT COUNT(*) as total FROM web_analytics WHERE DATE(created_at) = CURDATE() AND JSON_EXTRACT(data, '$.isBot') = false");
        const [unicos] = await db.query("SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(data, '$.visitorId'))) as total FROM web_analytics WHERE JSON_EXTRACT(data, '$.isBot') = false");
        
        const [historial] = await db.query(`
            SELECT 
                DATE(created_at) as fecha,
                COUNT(CASE WHEN evento = 'visita' THEN 1 END) as visitas,
                COUNT(CASE WHEN evento = 'click_solicitar' THEN 1 END) as clics
            FROM web_analytics 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            AND JSON_EXTRACT(data, '$.isBot') = false
            GROUP BY DATE(created_at)
            ORDER BY fecha ASC
        `);

        return {
            totalVisitas: visitas[0].total || 0,
            totalClics: clics[0].total || 0,
            eventosHoy: hoy[0].total || 0,
            visitantesUnicos: unicos[0].total || 0,
            historial: historial || []
        };
    }

    static async obtenerVisitantesUnicos(incluirBots = false) {
        const botFilter = incluirBots ? '' : "WHERE JSON_EXTRACT(data, '$.isBot') = false OR JSON_EXTRACT(data, '$.isBot') IS NULL";
        
        const [rows] = await db.query(`
            SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(data, '$.visitorId')) as visitorId,
                MAX(created_at) as ultima_actividad,
                COUNT(*) as total_eventos,
                ANY_VALUE(ip) as ip,
                ANY_VALUE(user_agent) as user_agent,
                ANY_VALUE(JSON_EXTRACT(data, '$.geo')) as geo,
                ANY_VALUE(JSON_EXTRACT(data, '$.isBot')) as isBot,
                -- Extraer Datos de Lead si existen
                MAX(CASE WHEN evento = 'lead_captured' THEN JSON_UNQUOTE(JSON_EXTRACT(data, '$.name')) END) as nombre_cliente,
                MAX(CASE WHEN evento = 'lead_captured' THEN JSON_UNQUOTE(JSON_EXTRACT(data, '$.phone')) END) as telefono_cliente,
                -- Detección de "Hot Prospect"
                (MAX(CASE WHEN evento = 'tiempo_permanencia' AND JSON_EXTRACT(data, '$.segundos') > 120 THEN 1 ELSE 0 END) OR 
                 MAX(CASE WHEN evento = 'click_solicitar' OR evento = 'lead_captured' THEN 1 ELSE 0 END)) as isHot
            FROM web_analytics
            ${botFilter}
            GROUP BY visitorId
            ORDER BY isHot DESC, ultima_actividad DESC
        `);
        return rows;
    }

    static async obtenerEventosPorVisitante(visitorId) {
        const [rows] = await db.query(`
            SELECT * FROM web_analytics 
            WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.visitorId')) = ?
            ORDER BY created_at DESC
        `, [visitorId]);
        return rows;
    }

    static async obtenerEventosRecientes(limite = 200, incluirBots = false) {
        const botFilter = incluirBots ? '' : "WHERE JSON_EXTRACT(data, '$.isBot') = false OR JSON_EXTRACT(data, '$.isBot') IS NULL";
        const [rows] = await db.query(`
            SELECT * FROM web_analytics 
            ${botFilter}
            ORDER BY created_at DESC LIMIT ?
        `, [limite]);
        return rows;
    }
}

module.exports = AnalyticsModel;
