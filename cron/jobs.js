const cron = require('node-cron');
const db = require('../config/db');
const { sendPushToAll } = require('../utils/pushService');

function initCronJobs() {
    // Todos los días a las 8:00 AM (0 8 * * *)
    // Para demostración lo configuraremos cada hora al minuto 0, o puedes dejarlo a las 8 AM
    cron.schedule('0 8 * * *', async () => {
        try {
            console.log("CRON: Verificando cuotas por vencer para notificaciones Push...");
            
            // Cuotas a vencer en los próximos 3 días
            const query = `
                SELECT p.id, p.monto_total, p.fecha_fin, c.nombre, c.apellido 
                FROM prestamos p 
                JOIN clientes c ON p.cliente_id = c.id 
                WHERE p.estado = 'pendiente' 
                AND DATEDIFF(p.fecha_fin, CURDATE()) BETWEEN 0 AND 3
            `;
            const [porVencer] = await db.query(query);

            if (porVencer.length > 0) {
                await sendPushToAll({
                    title: '⚠️ Cuotas por Vencer',
                    body: `Tienes ${porVencer.length} préstamo(s) que vencen en los próximos 3 días.`,
                    icon: '/img/logo.png',
                    url: '/prestamos'
                });
            }
            
            // Préstamos recién vencidos hoy (que vencieron ayer)
            const queryVencidos = `
                SELECT COUNT(*) as total 
                FROM prestamos 
                WHERE estado = 'vencido' AND fecha_fin = CURDATE() - INTERVAL 1 DAY
            `;
            const [vencidos] = await db.query(queryVencidos);
            if (vencidos[0].total > 0) {
                 await sendPushToAll({
                    title: '🚨 Préstamos Vencidos',
                    body: `${vencidos[0].total} préstamo(s) acaban de vencer hoy.`,
                    icon: '/img/logo.png',
                    url: '/prestamos'
                });
            }

        } catch (error) {
            console.error("Error en cron jobs:", error);
        }
    });
}

module.exports = { initCronJobs };
