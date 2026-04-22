const db = require('../config/db');

class DashboardModel {

    // 1. Obtener totales generales
    static async obtenerTotales() {
        try {
            const [clientes] = await db.query('SELECT COUNT(*) as total FROM clientes');
            const [prestamos] = await db.query("SELECT SUM(monto_prestado) as total FROM prestamos WHERE estado = 'pendiente'");
            const [empenos] = await db.query("SELECT COUNT(*) as total FROM empenos WHERE estado = 'en_custodia'");
            const [pagos] = await db.query("SELECT SUM(monto_pagado) as total FROM pagos");
            const [totalPrestadoHistorico] = await db.query("SELECT SUM(monto_prestado) as total FROM prestamos");
            const [ahorros] = await db.query("SELECT SUM(saldo_actual) as total FROM cuentas_ahorro");

            // --- CÁLCULO DE MORA ---
            const [mora] = await db.query("SELECT COUNT(*) as total, SUM(monto_total) as montoRiesgo FROM prestamos WHERE estado = 'pendiente' AND fecha_fin < CURDATE()");

            return {
                clientes: clientes[0].total || 0,
                dineroPrestado: prestamos[0].total || 0,
                articulosEmpeno: empenos[0].total || 0,
                dineroCobrado: pagos[0].total || 0,
                totalPrestadoHistorico: totalPrestadoHistorico[0].total || 0,
                totalAhorros: ahorros[0].total || 0,
                clientesMora: mora[0].total || 0,
                montoEnRiesgo: mora[0].montoRiesgo || 0
            };

        } catch (error) {
            throw error;
        }
    }

    // 2. Obtener datos para Gráficos
    static async obtenerDatosGraficos() {
        try {
            const query = `
                SELECT estado, COUNT(*) as cantidad 
                FROM prestamos 
                GROUP BY estado
            `;
            const [rows] = await db.query(query);
            return { distribucionPrestamos: rows };
        } catch (error) {
            throw error;
        }
    }

    // 3. Obtener lista de Clientes en Mora (NUEVO)
    static async obtenerDetalleMora() {
        try {
            const query = `
                SELECT p.*, c.nombre, c.apellido, c.telefono
                FROM prestamos p
                JOIN clientes c ON p.cliente_id = c.id
                WHERE p.estado = 'pendiente' AND p.fecha_fin < CURDATE()
                ORDER BY p.fecha_fin ASC
                LIMIT 5
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 4. Obtener Próximos Vencimientos (NUEVO - Próximos 7 días)
    static async obtenerProximosVencimientos() {
        try {
            const query = `
                SELECT p.*, c.nombre, c.apellido
                FROM prestamos p
                JOIN clientes c ON p.cliente_id = c.id
                WHERE p.estado = 'pendiente' 
                AND p.fecha_fin >= CURDATE() 
                AND p.fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                ORDER BY p.fecha_fin ASC
                LIMIT 5
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = DashboardModel;