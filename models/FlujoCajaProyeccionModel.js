const db = require('../config/db');

/**
 * Representa el modelo para realizar las proyecciones financieras del flujo de caja.
 */
class FlujoCajaProyeccionModel {

    /**
     * Calcula el saldo líquido actual acumulado en la caja de la empresa.
     * Suma todos los ingresos históricos y resta todos los egresos.
     * 
     * @returns {Promise<number>} Saldo neto disponible en caja hoy.
     */
    static async obtenerSaldoInicialCaja() {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) as balance 
            FROM caja
        `;
        const [rows] = await db.query(query);
        return parseFloat(rows[0].balance || 0);
    }

    /**
     * Obtiene todos los préstamos activos (pendiente) junto con la suma de los abonos ya realizados.
     * 
     * @returns {Promise<Array>} Lista de préstamos pendientes con su acumulado pagado.
     */
    static async obtenerPrestamosActivosConPagos() {
        const query = `
            SELECT 
                p.id, p.monto_total, p.cuotas, p.frecuencia, p.fecha_inicio, p.fecha_fin,
                COALESCE(SUM(pg.monto_pagado), 0) as total_pagado
            FROM prestamos p
            LEFT JOIN pagos pg ON p.id = pg.prestamo_id
            WHERE p.estado = 'pendiente'
            GROUP BY p.id
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    /**
     * Calcula el promedio de gastos diarios reales registrados en los últimos 30 días.
     * Retorna 0 según las especificaciones del usuario de omitir gastos.
     * 
     * @returns {Promise<number>} Gasto promedio diario (siempre 0).
     */
    static async obtenerPromedioGastosDiarios() {
        return 0;
    }

    /**
     * Calcula la serie de tiempo diaria proyectando ingresos por cuotas y egresos por promedio de gastos.
     * 
     * @param {number} [rangoDias=30] - Número de días a proyectar (15, 30, 45).
     * @returns {Promise<Object>} Contiene el saldo inicial, serie de proyección detallada y totales resumidos.
     */
    static async calcularProyeccion(rangoDias = 30) {
        // 1. Obtener datos iniciales de forma paralela para rendimiento
        const [saldoInicial, prestamos, gastoDiarioPromedio] = await Promise.all([
            this.obtenerSaldoInicialCaja(),
            this.obtenerPrestamosActivosConPagos(),
            this.obtenerPromedioGastosDiarios()
        ]);

        // 2. Definir fechas límite locales para el cálculo en JS
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaLimite = new Date(hoy);
        fechaLimite.setDate(fechaLimite.getDate() + rangoDias);

        // Mapa para acumular los ingresos proyectados por fecha (YYYY-MM-DD)
        const ingresosProyectadosPorFecha = {};

        // 3. Proyectar cuotas futuras de préstamos pendientes
        for (const p of prestamos) {
            const montoTotal = parseFloat(p.monto_total);
            const numCuotas = parseInt(p.cuotas);
            const totalPagado = parseFloat(p.total_pagado || 0);

            const valorCuota = montoTotal / numCuotas;
            const cuotasPagadas = Math.floor(totalPagado / valorCuota);

            // Analizar solo las cuotas que aún no han sido cobradas (desde cuotasPagadas + 1 hasta total cuotas)
            for (let i = cuotasPagadas + 1; i <= numCuotas; i++) {
                // Parsear fecha de inicio local sin desfase
                const dateParts = p.fecha_inicio instanceof Date 
                    ? [p.fecha_inicio.getFullYear(), p.fecha_inicio.getMonth() + 1, p.fecha_inicio.getDate()]
                    : p.fecha_inicio.split(/[-/]/).map(num => parseInt(num)); // [YYYY, MM, DD]

                const fechaCuota = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                fechaCuota.setHours(0, 0, 0, 0);

                // Sumar periodos según la frecuencia del préstamo
                const frecuenciaLwr = p.frecuencia.toLowerCase();
                if (frecuenciaLwr === 'diario') {
                    fechaCuota.setDate(fechaCuota.getDate() + i);
                } else if (frecuenciaLwr === 'semanal') {
                    fechaCuota.setDate(fechaCuota.getDate() + (i * 7));
                } else if (frecuenciaLwr === 'quincenal') {
                    fechaCuota.setDate(fechaCuota.getDate() + (i * 15));
                } else if (frecuenciaLwr === 'mensual') {
                    fechaCuota.setMonth(fechaCuota.getMonth() + i);
                } else if (frecuenciaLwr === 'bimensual') {
                    fechaCuota.setMonth(fechaCuota.getMonth() + (i * 2));
                } else if (frecuenciaLwr === 'trimensual') {
                    fechaCuota.setMonth(fechaCuota.getMonth() + (i * 3));
                } else {
                    // Fallback a mensual por defecto
                    fechaCuota.setMonth(fechaCuota.getMonth() + i);
                }

                // Verificar si el vencimiento de la cuota cae en el rango proyectado
                if (fechaCuota >= hoy && fechaCuota <= fechaLimite) {
                    const key = fechaCuota.toISOString().split('T')[0];
                    ingresosProyectadosPorFecha[key] = (ingresosProyectadosPorFecha[key] || 0) + valorCuota;
                }
            }
        }

        // 4. Generar la serie de tiempo diaria
        const serie = [];
        let saldoAcumulado = saldoInicial;
        let totalIngresosProyectados = 0;
        let totalEgresosProyectados = 0;

        for (let d = 0; d <= rangoDias; d++) {
            const fechaCursor = new Date(hoy);
            fechaCursor.setDate(fechaCursor.getDate() + d);
            const key = fechaCursor.toISOString().split('T')[0];

            const ingresos = ingresosProyectadosPorFecha[key] || 0;
            // El primer día (hoy, d = 0) no le proyectamos egreso ya que representa el punto de partida instantáneo
            const egresos = d === 0 ? 0 : gastoDiarioPromedio; 

            const saldoNeto = ingresos - egresos;
            saldoAcumulado += saldoNeto;

            totalIngresosProyectados += ingresos;
            totalEgresosProyectados += egresos;

            serie.push({
                fecha: key,
                fechaFormateada: fechaCursor.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' }),
                ingresos: parseFloat(ingresos.toFixed(2)),
                egresos: parseFloat(egresos.toFixed(2)),
                saldoNeto: parseFloat(saldoNeto.toFixed(2)),
                saldoProyectado: parseFloat(saldoAcumulado.toFixed(2))
            });
        }

        return {
            saldoInicial: parseFloat(saldoInicial.toFixed(2)),
            gastoDiarioEstimado: parseFloat(gastoDiarioPromedio.toFixed(2)),
            totalIngresosProyectados: parseFloat(totalIngresosProyectados.toFixed(2)),
            totalEgresosProyectados: parseFloat(totalEgresosProyectados.toFixed(2)),
            saldoFinalProyectado: parseFloat(saldoAcumulado.toFixed(2)),
            serie: serie
        };
    }
}

module.exports = FlujoCajaProyeccionModel;
