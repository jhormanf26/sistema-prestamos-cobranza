const db = require('../config/db');

class AnalyticsModel {
    static async registrarEvento(datos) {
        const { evento, ip, userAgent, data } = datos;
        const query = 'INSERT INTO web_analytics (evento, ip, user_agent, data) VALUES (?, ?, ?, ?)';
        return await db.query(query, [evento, ip, userAgent, JSON.stringify(data)]);
    }

    static async obtenerResumen(dias = 7) {
        try {
            console.log(`[Analytics] Obteniendo resumen para ${dias} días...`);
            const [
                [visitas], [clics], [leads], [hoy], [unicos], [historial], [scroll25], [scroll50], [scroll75], [scroll90]
            ] = await Promise.all([
                db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'visita' AND JSON_EXTRACT(data, '$.isBot') = false"),
                db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'click_solicitar'"),
                db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'lead_captured'"),
                db.query("SELECT COUNT(*) as total FROM web_analytics WHERE DATE(created_at) = CURDATE() AND JSON_EXTRACT(data, '$.isBot') = false"),
                db.query("SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(data, '$.visitorId'))) as total FROM web_analytics WHERE JSON_EXTRACT(data, '$.isBot') = false"),
                db.query(`
                    SELECT 
                        DATE(created_at) as fecha,
                        COUNT(CASE WHEN evento = 'visita' THEN 1 END) as visitas,
                        COUNT(CASE WHEN evento = 'click_solicitar' THEN 1 END) as clics,
                        COUNT(CASE WHEN evento = 'lead_captured' THEN 1 END) as leads
                    FROM web_analytics 
                    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    AND JSON_EXTRACT(data, '$.isBot') = false
                    GROUP BY DATE(created_at)
                    ORDER BY fecha ASC
                `, [dias]),
                db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'scroll_25'"),
                db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'scroll_50'"),
                db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'scroll_75'"),
                db.query("SELECT COUNT(*) as total FROM web_analytics WHERE evento = 'scroll_90'")
            ]);

            const totalV = (unicos && unicos.length > 0) ? (unicos[0].total || 1) : 1;
            const totalL = (leads && leads.length > 0) ? (leads[0].total || 0) : 0;
            const cr = ((totalL / totalV) * 100).toFixed(2);

            console.log(`[Analytics] Resumen procesado. Conversion Rate: ${cr}%`);

            return {
                totalVisitas: (visitas && visitas.length > 0) ? (visitas[0].total || 0) : 0,
                totalClics: (clics && clics.length > 0) ? (clics[0].total || 0) : 0,
                totalLeads: totalL,
                conversionRate: cr,
                eventosHoy: (hoy && hoy.length > 0) ? (hoy[0].total || 0) : 0,
                visitantesUnicos: (unicos && unicos.length > 0) ? (unicos[0].total || 0) : 0,
                historial: historial || [],
                scrollDepth: {
                    v25: (scroll25 && scroll25.length > 0) ? (scroll25[0].total || 0) : 0,
                    v50: (scroll50 && scroll50.length > 0) ? (scroll50[0].total || 0) : 0,
                    v75: (scroll75 && scroll75.length > 0) ? (scroll75[0].total || 0) : 0,
                    v90: (scroll90 && scroll90.length > 0) ? (scroll90[0].total || 0) : 0
                }
            };
        } catch (error) {
            console.error("[Analytics] Error en obtenerResumen:", error);
            throw error;
        }
    }

    static async obtenerEventosSocialProof() {
        const [rows] = await db.query(`
            SELECT evento, created_at, 
                   JSON_UNQUOTE(JSON_EXTRACT(data, '$.geo.ciudad')) as ciudad,
                   JSON_UNQUOTE(JSON_EXTRACT(data, '$.geo.pais')) as pais,
                   JSON_UNQUOTE(JSON_EXTRACT(data, '$.principal')) as monto
            FROM web_analytics 
            WHERE (evento = 'lead_captured' OR evento = 'click_solicitar')
            AND JSON_EXTRACT(data, '$.isBot') = false
            ORDER BY created_at DESC LIMIT 10
        `);
        return rows;
    }

    static async obtenerLeadsRecientes(limit = 20) {
        const [rows] = await db.query(`
            SELECT 
                created_at,
                JSON_UNQUOTE(JSON_EXTRACT(data, '$.name')) as nombre,
                JSON_UNQUOTE(JSON_EXTRACT(data, '$.phone')) as telefono,
                JSON_UNQUOTE(JSON_EXTRACT(data, '$.principal')) as monto,
                JSON_UNQUOTE(JSON_EXTRACT(data, '$.installments')) as cuotas,
                JSON_UNQUOTE(JSON_EXTRACT(data, '$.frequency')) as frecuencia,
                JSON_UNQUOTE(JSON_EXTRACT(data, '$.visitorId')) as visitorId
            FROM web_analytics 
            WHERE evento = 'lead_captured'
            ORDER BY created_at DESC 
            LIMIT ?
        `, [limit]);
        return rows;
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
                ANY_VALUE(JSON_UNQUOTE(JSON_EXTRACT(data, '$.referrer'))) as procedencia,
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
            SELECT *, JSON_UNQUOTE(JSON_EXTRACT(data, '$.referrer')) as procedencia FROM web_analytics 
            WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.visitorId')) = ?
            ORDER BY created_at DESC
        `, [visitorId]);
        return rows;
    }

    static async obtenerEventosRecientes(limite = 200, incluirBots = false) {
        const botFilter = incluirBots ? '' : "WHERE JSON_EXTRACT(data, '$.isBot') = false OR JSON_EXTRACT(data, '$.isBot') IS NULL";
        const [rows] = await db.query(`
            SELECT *, JSON_UNQUOTE(JSON_EXTRACT(data, '$.referrer')) as procedencia FROM web_analytics 
            ${botFilter}
            ORDER BY created_at DESC LIMIT ?
        `, [limite]);
        return rows;
    }
}

module.exports = AnalyticsModel;
