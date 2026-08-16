const db = require('../config/db');

class InversionModel {
    /**
     * Obtiene o crea una cuenta de inversión identificada por tipo y número de cuenta.
     * @param {string} tipoCuenta Nombre/Tipo de inversión (ej. FIC Sumar)
     * @param {string} numeroCuenta Número identificador de la cuenta
     * @param {number} saldoInicial Saldo inicial reportado
     * @param {string|null} descripcion Descripción opcional
     * @returns {Promise<Object>} Datos de la cuenta de inversión
     */
    static async obtenerOCrearCuenta(tipoCuenta, numeroCuenta, saldoInicial = 0, descripcion = null) {
        const [filas] = await db.query(
            'SELECT * FROM inversiones WHERE tipo_cuenta = ? AND numero_cuenta = ?',
            [tipoCuenta, numeroCuenta]
        );

        if (filas.length > 0) {
            return filas[0];
        }

        const [res] = await db.query(
            'INSERT INTO inversiones (tipo_cuenta, numero_cuenta, saldo_inicial, saldo, descripcion) VALUES (?, ?, ?, ?, ?)',
            [tipoCuenta, numeroCuenta, parseFloat(saldoInicial || 0), parseFloat(saldoInicial || 0), descripcion]
        );

        const [nueva] = await db.query('SELECT * FROM inversiones WHERE id = ?', [res.insertId]);
        return nueva[0];
    }

    /**
     * Crea manualmente una nueva cuenta de inversión.
     * @param {Object} datos { tipo_cuenta, numero_cuenta, saldo_inicial, descripcion }
     * @returns {Promise<Object>} Cuenta recién creada
     */
    static async crearCuentaManual({ tipo_cuenta, numero_cuenta, saldo_inicial = 0, descripcion = null }) {
        return await this.obtenerOCrearCuenta(tipo_cuenta, numero_cuenta, parseFloat(saldo_inicial || 0), descripcion);
    }

    /**
     * Lista todas las cuentas de inversión con su balance de KPIs acumulados.
     * @returns {Promise<Array>} Lista de cuentas de inversión
     */
    static async obtenerTodasLasCuentas() {
        const sql = `
            SELECT i.*, 
                COALESCE(SUM(CASE WHEN m.tipo_movimiento = 'inversion' THEN m.valor ELSE 0 END), 0) AS total_capital,
                COALESCE(SUM(CASE WHEN m.tipo_movimiento = 'rendimiento' THEN m.valor ELSE 0 END), 0) AS total_rendimientos,
                COALESCE(SUM(CASE WHEN m.tipo_movimiento = 'retiro' THEN ABS(m.valor) ELSE 0 END), 0) AS total_retiros,
                COALESCE(SUM(CASE WHEN m.tipo_movimiento = 'retiro' THEN -ABS(m.valor) ELSE m.valor END), 0) AS neto_movimientos,
                COUNT(m.id) AS total_movimientos
            FROM inversiones i
            LEFT JOIN movimientos_inversion m ON i.id = m.inversion_id
            GROUP BY i.id
            ORDER BY i.created_at DESC
        `;
        const [filas] = await db.query(sql);
        return filas;
    }

    /**
     * Obtiene una cuenta por su ID.
     * @param {number} id ID de la inversión
     * @returns {Promise<Object|null>} Registro de la inversión
     */
    static async obtenerCuentaPorId(id) {
        const [filas] = await db.query('SELECT * FROM inversiones WHERE id = ?', [id]);
        return filas[0] || null;
    }

    /**
     * Procesa un lote de movimientos proveniente de un CSV impidiendo duplicados.
     * @param {Object} datosCSV Datos parseados { tipo_cuenta, numero_cuenta, saldo, movimientos }
     * @returns {Promise<Object>} Resultado con totales de insertados e ignorados
     */
    static async procesarImportacionCSV(datosCSV) {
        const cuenta = await this.obtenerOCrearCuenta(
            datosCSV.tipo_cuenta,
            datosCSV.numero_cuenta,
            datosCSV.saldo
        );

        let insertados = 0;
        let ignorados = 0;

        for (const mov of datosCSV.movimientos) {
            try {
                const [res] = await db.query(
                    `INSERT IGNORE INTO movimientos_inversion 
                        (inversion_id, fecha, descripcion, tipo_movimiento, valor) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [cuenta.id, mov.fecha, mov.descripcion, mov.tipo_movimiento, mov.valor]
                );

                if (res.affectedRows > 0) {
                    insertados++;
                } else {
                    ignorados++;
                }
            } catch (error) {
                console.error('Error insertando movimiento de inversión:', error.message);
                ignorados++;
            }
        }

        // Recalcular saldo total de la cuenta sumando todos los movimientos
        await this.recalcularSaldoCuenta(cuenta.id);

        const cuentaActualizada = await this.obtenerCuentaPorId(cuenta.id);

        return {
            cuenta: cuentaActualizada,
            totalProcesados: datosCSV.movimientos.length,
            insertados,
            ignorados
        };
    }

    /**
     * Recalcula y actualiza el saldo de la cuenta basado en la suma de sus movimientos.
     * @param {number} inversionId ID de la inversión
     */
    static async recalcularSaldoCuenta(inversionId) {
        const [cuenta] = await db.query('SELECT saldo_inicial FROM inversiones WHERE id = ?', [inversionId]);
        const saldoInicialBase = cuenta[0] ? parseFloat(cuenta[0].saldo_inicial || 0) : 0;

        const [filas] = await db.query(
            `SELECT COALESCE(SUM(
                CASE 
                    WHEN tipo_movimiento = 'retiro' AND valor > 0 THEN -valor
                    ELSE valor
                END
            ), 0) AS neto_movimientos
            FROM movimientos_inversion 
            WHERE inversion_id = ?`,
            [inversionId]
        );
        const netoMovimientos = parseFloat(filas[0]?.neto_movimientos || 0);
        const nuevoSaldo = saldoInicialBase + netoMovimientos;

        await db.query('UPDATE inversiones SET saldo = ? WHERE id = ?', [nuevoSaldo, inversionId]);
    }

    /**
     * Registra un movimiento individual manualmente.
     * @param {Object} datosMovimiento { inversion_id, fecha, descripcion, tipo_movimiento, valor }
     * @returns {Promise<Object>} Resultado de la inserción
     */
    static async crearMovimientoManual({ inversion_id, fecha, descripcion, tipo_movimiento, valor }) {
        const [res] = await db.query(
            `INSERT INTO movimientos_inversion (inversion_id, fecha, descripcion, tipo_movimiento, valor)
             VALUES (?, ?, ?, ?, ?)`,
            [inversion_id, fecha, descripcion, tipo_movimiento, valor]
        );

        await this.recalcularSaldoCuenta(inversion_id);
        return res.insertId;
    }

    /**
     * Obtiene el resumen consolidado de KPIs (Capital Invertido, Rendimientos, Retiros, Saldo Neto y % ROI).
     * @param {number|null} inversionId ID opcional para filtrar por cuenta específica
     * @returns {Promise<Object>} Métricas consolidada de KPIs
     */
    static async obtenerResumenKPIs(inversionId = null) {
        let sql = `
            SELECT 
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'inversion' THEN valor ELSE 0 END), 0) AS capital_movimientos,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'rendimiento' THEN valor ELSE 0 END), 0) AS rendimientos_totales,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'retiro' THEN ABS(valor) ELSE 0 END), 0) AS retiros_totales,
                COUNT(*) AS total_movimientos
            FROM movimientos_inversion
        `;
        const params = [];

        if (inversionId) {
            sql += ' WHERE inversion_id = ?';
            params.push(inversionId);
        }

        const [filas] = await db.query(sql, params);
        const kpis = filas[0] || { capital_movimientos: 0, rendimientos_totales: 0, retiros_totales: 0, total_movimientos: 0 };

        // Obtener saldo_inicial acumulado
        let sqlInit = 'SELECT COALESCE(SUM(saldo_inicial), 0) AS total_saldo_inicial FROM inversiones';
        const paramsInit = [];
        if (inversionId) {
            sqlInit += ' WHERE id = ?';
            paramsInit.push(inversionId);
        }
        const [resInit] = await db.query(sqlInit, paramsInit);
        const saldoInicialTotal = parseFloat(resInit[0]?.total_saldo_inicial || 0);

        const capitalNum = saldoInicialTotal + parseFloat(kpis.capital_movimientos);
        const rendimientosNum = parseFloat(kpis.rendimientos_totales);
        const retirosNum = parseFloat(kpis.retiros_totales);

        // Saldo Actual Estimado = Capital Invertido + Rendimientos - Retiros
        const saldoActual = (capitalNum + rendimientosNum) - retirosNum;

        // Porcentaje ROI (Rentabilidad = Rendimientos / Capital Invertido * 100)
        const porcentajeROI = capitalNum > 0 ? ((rendimientosNum / capitalNum) * 100) : 0;

        return {
            saldo_inicial: saldoInicialTotal,
            capital_invertido: capitalNum,
            rendimientos_totales: rendimientosNum,
            retiros_totales: retirosNum,
            saldo_actual: saldoActual,
            porcentaje_roi: parseFloat(porcentajeROI.toFixed(2)),
            total_movimientos: kpis.total_movimientos
        };
    }

    /**
     * Obtiene las series temporales agrupadas por mes para gráficos en Chart.js.
     * @param {number|null} inversionId ID opcional de cuenta
     * @returns {Promise<Object>} { labels: [], rendimientos: [], retiros: [], inversiones: [] }
     */
    static async obtenerSerieMensual(inversionId = null) {
        let sql = `
            SELECT 
                DATE_FORMAT(fecha, '%Y-%m') AS periodo,
                DATE_FORMAT(fecha, '%b %Y') AS etiqueta,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'rendimiento' THEN valor ELSE 0 END), 0) AS rendimientos,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'retiro' THEN ABS(valor) ELSE 0 END), 0) AS retiros,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'inversion' THEN valor ELSE 0 END), 0) AS inversiones
            FROM movimientos_inversion
        `;
        const params = [];

        if (inversionId) {
            sql += ' WHERE inversion_id = ?';
            params.push(inversionId);
        }

        sql += ' GROUP BY periodo, etiqueta ORDER BY periodo ASC';

        const [filas] = await db.query(sql, params);

        const labels = filas.map(f => f.etiqueta || f.periodo);
        const rendimientos = filas.map(f => parseFloat(f.rendimientos));
        const retiros = filas.map(f => parseFloat(f.retiros));
        const inversiones = filas.map(f => parseFloat(f.inversiones));

        return {
            labels,
            rendimientos,
            retiros,
            inversiones
        };
    }

    /**
     * Obtiene listado de movimientos con paginación y filtros.
     * @param {number|null} inversionId ID de cuenta opcional
     * @param {number} pagina Página actual
     * @param {number} limite Límite por página
     * @param {string} busqueda Búsqueda por texto
     * @returns {Promise<Object>} { movimientos: [], paginacion: {} }
     */
    static async obtenerMovimientosPaginados(inversionId = null, pagina = 1, limite = 50, busqueda = '') {
        const offset = (pagina - 1) * limite;
        let dondeClause = ' WHERE 1=1';
        const params = [];

        if (inversionId) {
            dondeClause += ' AND m.inversion_id = ?';
            params.push(inversionId);
        }

        if (busqueda) {
            dondeClause += ' AND (m.descripcion LIKE ? OR m.tipo_movimiento LIKE ? OR i.tipo_cuenta LIKE ?)';
            const q = `%${busqueda}%`;
            params.push(q, q, q);
        }

        const sqlTotal = `
            SELECT COUNT(*) AS total 
            FROM movimientos_inversion m
            JOIN inversiones i ON m.inversion_id = i.id
            ${dondeClause}
        `;
        const [totalRows] = await db.query(sqlTotal, params);
        const total = totalRows[0]?.total || 0;

        const sqlMovs = `
            SELECT m.*, i.tipo_cuenta, i.numero_cuenta
            FROM movimientos_inversion m
            JOIN inversiones i ON m.inversion_id = i.id
            ${dondeClause}
            ORDER BY m.fecha DESC, m.id DESC
            LIMIT ? OFFSET ?
        `;
        const paramsLimit = [...params, parseInt(limite), parseInt(offset)];
        const [movimientos] = await db.query(sqlMovs, paramsLimit);

        return {
            movimientos,
            paginacion: {
                total,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                totalPaginas: Math.ceil(total / limite)
            }
        };
    }

    /**
     * Elimina un movimiento individual.
     * @param {number} id ID del movimiento
     */
    static async eliminarMovimiento(id) {
        const [filas] = await db.query('SELECT inversion_id FROM movimientos_inversion WHERE id = ?', [id]);
        if (filas.length > 0) {
            const inversionId = filas[0].inversion_id;
            await db.query('DELETE FROM movimientos_inversion WHERE id = ?', [id]);
            await this.recalcularSaldoCuenta(inversionId);
        }
    }

    /**
     * Elimina una inversión y todos sus movimientos asociados.
     * @param {number} id ID de la inversión
     */
    static async eliminarInversion(id) {
        await db.query('DELETE FROM inversiones WHERE id = ?', [id]);
    }

    /**
     * Calcula una proyección matemática a futuro basada en la rentabilidad histórica promedio.
     * @param {number|null} inversionId ID de cuenta o null para global
     * @param {number} mesesNumero Cantidad de meses a proyectar
     * @returns {Promise<Object>} Proyección mes a mes
     */
    static async calcularProyeccion(inversionId = null, mesesNumero = 6) {
        const kpis = await this.obtenerResumenKPIs(inversionId);
        let saldoBase = kpis.saldo_actual;

        let tasaPromedioMensual = 0.005; // 0.5% mensual por defecto

        // Obtener historial mensual reconstruyendo el saldo acumulado mes a mes
        let sqlMovs = `
            SELECT 
                DATE_FORMAT(fecha, '%Y-%m') AS periodo,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'inversion' THEN valor ELSE 0 END), 0) AS inversiones,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'rendimiento' THEN valor ELSE 0 END), 0) AS rendimientos,
                COALESCE(SUM(CASE WHEN tipo_movimiento = 'retiro' THEN ABS(valor) ELSE 0 END), 0) AS retiros
            FROM movimientos_inversion
        `;
        const params = [];
        if (inversionId) {
            sqlMovs += ' WHERE inversion_id = ?';
            params.push(inversionId);
        }
        sqlMovs += ' GROUP BY periodo ORDER BY periodo ASC';

        const [filasMeses] = await db.query(sqlMovs, params);

        if (filasMeses.length > 0) {
            let sqlInit = 'SELECT COALESCE(SUM(saldo_inicial), 0) AS total_init FROM inversiones';
            const paramsInit = [];
            if (inversionId) {
                sqlInit += ' WHERE id = ?';
                paramsInit.push(inversionId);
            }
            const [resInit] = await db.query(sqlInit, paramsInit);
            let saldoCorrido = parseFloat(resInit[0]?.total_init || 0);

            let sumaRendimientosHist = 0;
            let sumaSaldosBaseHist = 0;

            for (const f of filasMeses) {
                const inv = parseFloat(f.inversiones);
                const rend = parseFloat(f.rendimientos);
                const ret = parseFloat(f.retiros);

                if (saldoCorrido > 0 && rend > 0) {
                    sumaRendimientosHist += rend;
                    sumaSaldosBaseHist += saldoCorrido;
                }
                saldoCorrido += (inv + rend - ret);
            }

            if (sumaSaldosBaseHist > 0 && sumaRendimientosHist > 0) {
                tasaPromedioMensual = sumaRendimientosHist / sumaSaldosBaseHist;
            }
        }

        const proyeccionDetalle = [];
        let saldoAcumulado = saldoBase;
        const fechaActual = new Date();

        for (let i = 1; i <= mesesNumero; i++) {
            const fechaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + i, 1);
            const mesNombre = fechaMes.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
            
            const rendimientoMes = saldoAcumulado * tasaPromedioMensual;
            saldoAcumulado += rendimientoMes;

            proyeccionDetalle.push({
                mes: mesNombre,
                rendimientoEstimado: parseFloat(rendimientoMes.toFixed(2)),
                saldoProyectado: parseFloat(saldoAcumulado.toFixed(2))
            });
        }

        const promedioRendimientoMensual = saldoBase * tasaPromedioMensual;

        return {
            saldoBase,
            promedioRendimientoMensual: parseFloat(promedioRendimientoMensual.toFixed(2)),
            tasaEstimadaPorcentaje: parseFloat((tasaPromedioMensual * 100).toFixed(2)),
            proyeccion: proyeccionDetalle
        };
    }

    /**
     * Actualiza la información de una cuenta de inversión existente.
     * @param {number} id ID de la inversión
     * @param {Object} datos { tipo_cuenta, numero_cuenta, saldo_inicial, descripcion }
     */
    static async actualizarCuenta(id, { tipo_cuenta, numero_cuenta, saldo_inicial = 0, descripcion }) {
        await db.query(
            'UPDATE inversiones SET tipo_cuenta = ?, numero_cuenta = ?, saldo_inicial = ?, descripcion = ? WHERE id = ?',
            [tipo_cuenta, numero_cuenta, parseFloat(saldo_inicial || 0), descripcion || null, id]
        );
        await this.recalcularSaldoCuenta(id);
    }
}

module.exports = InversionModel;
