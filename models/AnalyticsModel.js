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
        
        // Obtener historial de los últimos 7 días para el gráfico
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

    static async obtenerEventosRecientes(limit = 10) {
        const query = 'SELECT * FROM web_analytics ORDER BY created_at DESC LIMIT ?';
        const [rows] = await db.query(query, [limit]);
        return rows;
    }
}

module.exports = AnalyticsModel;
