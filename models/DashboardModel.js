const db = require('../config/db');

class DashboardModel {

    // ... (otros métodos se mantienen igual)

    // 7. Gastos por categoría
    static async obtenerGastosPorCategoria() {
        try {
            const query = 'SELECT categoria, SUM(monto) as total FROM gastos GROUP BY categoria';
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }

    // 8. Gastos últimos 7 días
    static async obtenerGastosUltimosDias() {
        try {
            const query = "SELECT DATE(fecha_gasto) as fecha, SUM(monto) as total FROM gastos WHERE fecha_gasto >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(fecha_gasto) ORDER BY fecha ASC";
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }

    // 9. Flujo de Caja (Ingresos vs Gastos últimos 6 meses)
    static async obtenerFlujoCaja() {
        try {
            const query = `
                SELECT 
                    DATE_FORMAT(fecha, '%Y-%m') as mes,
                    SUM(ingresos) as ingresos,
                    SUM(gastos) as gastos
                FROM (
                    SELECT fecha_pago as fecha, monto_pagado as ingresos, 0 as gastos FROM pagos
                    UNION ALL
                    SELECT fecha_gasto as fecha, 0 as ingresos, monto as gastos FROM gastos
                ) as combinados
                WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(fecha, '%Y-%m')
                ORDER BY mes ASC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }

    // 10. Gastos por Registrador
    static async obtenerGastosPorUsuario() {
        try {
            const query = 'SELECT registrado_por as usuario, SUM(monto) as total FROM gastos GROUP BY registrado_por ORDER BY total DESC';
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }

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
            const [mora] = await db.query(`
                SELECT COUNT(*) as total, SUM(monto_total) as montoRiesgo FROM (
                    SELECT p.monto_total, 
                    CASE p.frecuencia
                        WHEN 'Diario' THEN DATE_ADD(p.fecha_inicio, INTERVAL FLOOR(IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) / (p.monto_total / p.cuotas)) + 1 DAY)
                        WHEN 'Semanal' THEN DATE_ADD(p.fecha_inicio, INTERVAL FLOOR(IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) / (p.monto_total / p.cuotas)) + 1 WEEK)
                        WHEN 'Quincenal' THEN DATE_ADD(p.fecha_inicio, INTERVAL (FLOOR(IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) / (p.monto_total / p.cuotas)) + 1) * 15 DAY)
                        WHEN 'Mensual' THEN DATE_ADD(p.fecha_inicio, INTERVAL FLOOR(IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) / (p.monto_total / p.cuotas)) + 1 MONTH)
                        ELSE DATE_ADD(p.fecha_inicio, INTERVAL FLOOR(IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) / (p.monto_total / p.cuotas)) + 1 MONTH)
                    END as proxima_fecha
                    FROM prestamos p WHERE p.estado = 'pendiente'
                ) as calc
                WHERE proxima_fecha < CURDATE()
            `);
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
            const query = `
                SELECT *, 
                    CASE frecuencia
                        WHEN 'Diario' THEN DATE_ADD(fecha_inicio, INTERVAL cuotas_cubiertas + 1 DAY)
                        WHEN 'Semanal' THEN DATE_ADD(fecha_inicio, INTERVAL cuotas_cubiertas + 1 WEEK)
                        WHEN 'Quincenal' THEN DATE_ADD(fecha_inicio, INTERVAL (cuotas_cubiertas + 1) * 15 DAY)
                        WHEN 'Mensual' THEN DATE_ADD(fecha_inicio, INTERVAL cuotas_cubiertas + 1 MONTH)
                        ELSE DATE_ADD(fecha_inicio, INTERVAL cuotas_cubiertas + 1 MONTH)
                    END as proxima_fecha
                FROM (
                    SELECT 
                        p.*, 
                        c.nombre, 
                        c.apellido, 
                        c.telefono,
                        IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) as total_pagado,
                        FLOOR(
                            IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) / (p.monto_total / p.cuotas)
                        ) as cuotas_cubiertas
                    FROM prestamos p
                    JOIN clientes c ON p.cliente_id = c.id
                    WHERE p.estado = 'pendiente'
                ) as prestamos_calculados
                HAVING proxima_fecha < CURDATE()
                ORDER BY proxima_fecha ASC
                LIMIT 10
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) { throw error; }
    }

    static async obtenerProximosVencimientos() {
        try {
            const query = `
                SELECT *, 
                    CASE frecuencia
                        WHEN 'Diario' THEN DATE_ADD(fecha_inicio, INTERVAL cuotas_cubiertas + 1 DAY)
                        WHEN 'Semanal' THEN DATE_ADD(fecha_inicio, INTERVAL cuotas_cubiertas + 1 WEEK)
                        WHEN 'Quincenal' THEN DATE_ADD(fecha_inicio, INTERVAL (cuotas_cubiertas + 1) * 15 DAY)
                        WHEN 'Mensual' THEN DATE_ADD(fecha_inicio, INTERVAL cuotas_cubiertas + 1 MONTH)
                        ELSE DATE_ADD(fecha_inicio, INTERVAL cuotas_cubiertas + 1 MONTH)
                    END as proxima_fecha
                FROM (
                    SELECT 
                        p.*, 
                        c.nombre, 
                        c.apellido,
                        IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) as total_pagado,
                        FLOOR(
                            IFNULL((SELECT SUM(monto_pagado) FROM pagos WHERE prestamo_id = p.id), 0) / (p.monto_total / p.cuotas)
                        ) as cuotas_cubiertas
                    FROM prestamos p
                    JOIN clientes c ON p.cliente_id = c.id
                    WHERE p.estado = 'pendiente'
                ) as prestamos_calculados
                HAVING proxima_fecha >= CURDATE() AND proxima_fecha <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                ORDER BY proxima_fecha ASC
                LIMIT 10
            `;
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