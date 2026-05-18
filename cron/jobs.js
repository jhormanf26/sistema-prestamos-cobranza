const cron = require('node-cron');
const db = require('../config/db');
const { sendPushToAll } = require('../utils/pushService');
const { calcularCronograma } = require('../utils/finance');
const emailService = require('../utils/emailService');
const { formatCurrency } = require('../utils/formatters');
const ConfigModel = require('../models/ConfigModel');

function initCronJobs() {
    // Todos los días a las 8:00 AM (0 8 * * *)
    cron.schedule('0 8 * * *', async () => {
        try {
            console.log("CRON: Ejecutando tareas programadas diarias...");
            
            // 1. Notificaciones PUSH para Administradores (Cuotas a vencer de la tabla prestamos (fecha final))
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

            // 2. Notificaciones por CORREO a los Clientes (3 días antes de CADA CUOTA)
            console.log("CRON: Verificando recordatorios de correo para clientes...");
            
            const queryActivos = `
                SELECT p.*, c.nombre, c.apellido, c.email,
                (SELECT IFNULL(SUM(monto_pagado), 0) FROM pagos WHERE prestamo_id = p.id) as total_pagado
                FROM prestamos p 
                JOIN clientes c ON p.cliente_id = c.id 
                WHERE p.estado = 'pendiente' AND c.email IS NOT NULL AND c.email != ''
            `;
            const [prestamosActivos] = await db.query(queryActivos);

            const hoy = new Date();
            hoy.setHours(0,0,0,0);

            for (const prestamo of prestamosActivos) {
                const cronograma = calcularCronograma(parseFloat(prestamo.monto_total), prestamo.cuotas, prestamo.frecuencia, prestamo.fecha_inicio);
                let totalPagado = parseFloat(prestamo.total_pagado);
                
                let proximaCuota = null;
                for (const cuota of cronograma) {
                    if (totalPagado >= cuota.monto - 0.1) {
                        totalPagado -= cuota.monto;
                    } else {
                        proximaCuota = cuota;
                        break;
                    }
                }

                if (proximaCuota) {
                    const fechaCuota = new Date(proximaCuota.fecha);
                    fechaCuota.setHours(0,0,0,0);
                    
                    // Diferencia en días
                    const diffTime = fechaCuota - hoy;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    // Si faltan exactamente 3 días
                    if (diffDays === 3) {
                        const config = await ConfigModel.obtener();
                        const moneda = config ? config.moneda : '$';
                        const nombreEmpresa = config ? config.nombre_empresa : 'SISTEMA DE PRÉSTAMOS';

                        const html = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                                <div style="background-color: #f59e0b; padding: 20px; text-align: center; color: white;">
                                    <h2 style="margin: 0;">Recordatorio de Pago</h2>
                                </div>
                                <div style="padding: 30px; background-color: #ffffff;">
                                    <p style="font-size: 16px; color: #334155;">Hola <strong>${prestamo.nombre}</strong>,</p>
                                    <p style="font-size: 16px; color: #334155;">Te recordamos que tu cuota <strong>#${proximaCuota.numero}</strong> del préstamo #${prestamo.id} vence en <strong>3 días</strong>.</p>
                                    
                                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                                        <p style="margin: 0; font-size: 18px;"><strong>Fecha de Vencimiento:</strong> ${fechaCuota.toLocaleDateString()}</p>
                                        <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>Monto a Pagar:</strong> ${moneda} ${formatCurrency(proximaCuota.monto, 2)}</p>
                                    </div>
                                    
                                    <p style="font-size: 14px; color: #64748b;">Evita cargos adicionales por mora realizando tu pago a tiempo. Si ya realizaste el pago en las últimas horas, ignora este mensaje.</p>
                                    <div style="text-align: center; margin-top: 30px;">
                                        <a href="${config && config.url_sistema ? config.url_sistema : 'http://localhost:3000'}/portal-cliente/login" style="background-color: #10b981; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; display: inline-block;">Ver Mi Portal</a>
                                    </div>
                                </div>
                            </div>
                        `;

                        try {
                            await emailService.enviarCorreo(
                                prestamo.email, 
                                `Recordatorio de Pago - ${nombreEmpresa}`, 
                                html
                            );
                            console.log(`CRON: Correo de recordatorio enviado a ${prestamo.email} (Préstamo #${prestamo.id})`);
                        } catch (error) {
                            console.error(`CRON: Error enviando recordatorio a ${prestamo.email}:`, error);
                        }
                    }
                }
            }
            console.log("CRON: Verificación de correos completada.");

        } catch (error) {
            console.error("Error en cron jobs:", error);
        }
    });
}

module.exports = { initCronJobs };
