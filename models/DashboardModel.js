const db = require('../config/db');

class DashboardModel {

    // ... (otros métodos se mantienen igual)

    // 6. Oportunidades de Re-Inversión (Préstamos > 80% pagados)
    static async obtenerOportunidadesRenovacion() {
        try {
            const query = `
                SELECT 
                    p.id, p.monto_total, p.monto_prestado,
                    c.nombre, c.apellido, c.telefono,
                    COALESCE(SUM(pg.monto_pagado), 0) as total_pagado,
                    ROUND((COALESCE(SUM(pg.monto_pagado), 0) / p.monto_total) * 100, 1) as progreso
                FROM prestamos p
                JOIN clientes c ON p.cliente_id = c.id
                LEFT JOIN pagos pg ON p.id = pg.prestamo_id
                WHERE p.estado = 'pendiente'
                GROUP BY p.id
                HAVING progreso >= 80 AND progreso < 100
                ORDER BY progreso DESC
                LIMIT 5
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }

    // --- RE-INSERTANDO MÉTODOS ANTERIORES PARA INTEGRIDAD ---
    static async obtenerTotales() {
        try {
            const [clientes] = await db.query('SELECT COUNT(*) as total FROM clientes');
            const [prestamos] = await db.query("SELECT SUM(monto_prestado) as total FROM prestamos WHERE estado = 'pendiente'");
            const [ahorros] = await db.query("SELECT SUM(saldo_actual) as total FROM cuentas_ahorro");
            const [pagos] = await db.query("SELECT SUM(monto_pagado) as total FROM pagos");
            const [totalPrestadoHistorico] = await db.query("SELECT SUM(monto_prestado) as total FROM prestamos");
            const [mora] = await db.query("SELECT COUNT(*) as total, SUM(monto_total) as montoRiesgo FROM prestamos WHERE estado = 'pendiente' AND fecha_fin < CURDATE()");
            return {
                clientes: clientes[0].total || 0,
                dineroPrestado: prestamos[0].total || 0,
                dineroCobrado: pagos[0].total || 0,
                totalPrestadoHistorico: totalPrestadoHistorico[0].total || 0,
                totalAhorros: ahorros[0].total || 0,
                clientesMora: mora[0].total || 0,
                montoEnRiesgo: mora[0].montoRiesgo || 0
            };
        } catch (error) { throw error; }
    }

    static async obtenerDatosGraficos() {
        try {
            const [rows] = await db.query('SELECT estado, COUNT(*) as cantidad FROM prestamos GROUP BY estado');
            return { distribucionPrestamos: rows };
        } catch (error) { throw error; }
    }

    static async obtenerDetalleMora() {
        try {
            const query = `SELECT p.*, c.nombre, c.apellido, c.telefono FROM prestamos p JOIN clientes c ON p.cliente_id = c.id WHERE p.estado = 'pendiente' AND p.fecha_fin < CURDATE() ORDER BY p.fecha_fin ASC LIMIT 5`;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }

    static async obtenerProximosVencimientos() {
        try {
            const query = `SELECT p.*, c.nombre, c.apellido FROM prestamos p JOIN clientes c ON p.cliente_id = c.id WHERE p.estado = 'pendiente' AND p.fecha_fin >= CURDATE() AND p.fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) ORDER BY p.fecha_fin ASC LIMIT 5`;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }

    static async obtenerHistorialFinalizados() {
        try {
            const query = `SELECT c.nombre, c.apellido, c.telefono, COUNT(p.id) as total_prestamos, MIN(p.monto_prestado) as capital_min, MAX(p.monto_prestado) as capital_max, MIN(p.tasa_interes) as interes_min_pct, MAX(p.tasa_interes) as interes_max_pct FROM prestamos p JOIN clientes c ON p.cliente_id = c.id WHERE p.estado = 'pagado' GROUP BY c.id ORDER BY total_prestamos DESC LIMIT 10`;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }
}

module.exports = DashboardModel;