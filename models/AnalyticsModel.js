const db = require('../config/db');

class AnalyticsModel {
    static async registrarEvento(datos) {
        const { evento, ip, userAgent, data } = datos;
        const query = 'INSERT INTO web_analytics (evento, ip, user_agent, data) VALUES (?, ?, ?, ?)';
        return await db.query(query, [evento, ip, userAgent, JSON.stringify(data)]);
    }

    static async obtenerResumen() {
        const [visitas] = await db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'visita'");
        const [clics] = await db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'click_solicitar'");
        const [hoy] = await db.query("SELECT COUNT(*) as total FROM web_analytics WHERE DATE(created_at) = CURDATE()");
        const [unicos] = await db.query("SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(data, '$.visitorId'))) as total FROM web_analytics");
        
        const [historial] = await db.query(`
            SELECT 
                DATE(created_at) as fecha,
                COUNT(CASE WHEN evento = 'visita' THEN 1 END) as visitas,
                COUNT(CASE WHEN evento = 'click_solicitar' THEN 1 END) as clics
            FROM web_analytics 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
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

    static async obtenerVisitantesUnicos() {
        const [rows] = await db.query(`
            SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(data, '$.visitorId')) as visitorId,
                MAX(created_at) as ultima_actividad,
                COUNT(*) as total_eventos,
                ANY_VALUE(ip) as ip,
                ANY_VALUE(user_agent) as user_agent,
                ANY_VALUE(JSON_EXTRACT(data, '$.geo')) as geo
            FROM web_analytics
            GROUP BY visitorId
            ORDER BY ultima_actividad DESC
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

    static async obtenerEventosRecientes(limite = 100) {
        const [rows] = await db.query('SELECT * FROM web_analytics ORDER BY created_at DESC LIMIT ?', [limite]);
        return rows;
    }
}

module.exports = AnalyticsModel;
