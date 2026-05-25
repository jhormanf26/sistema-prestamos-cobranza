const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const PrestamoModel = require('../models/PrestamoModel');
const AhorroModel = require('../models/AhorroModel');
const PagoModel = require('../models/PagoModel');
const finance = require('./finance');

/**
 * Servicio para el cálculo dinámico del Scoring Crediticio de Clientes.
 */
const scoringService = {

    /**
     * Calcula el Score Crediticio interno de un cliente en tiempo real.
     * @param {number|string} clienteId - ID del cliente a evaluar.
     * @returns {Promise<Object>} Datos del score calculado, desglose, nivel de riesgo y consejos.
     */
    calcularScore: async (clienteId) => {
        try {
            // 1. Cargar información requerida de manera concurrente para velocidad
            const [cliente, prestamos, cuentaAhorro] = await Promise.all([
                ClienteModel.obtenerPorId(clienteId),
                PrestamoModel.obtenerPorCliente(clienteId),
                AhorroModel.buscarPorCliente(clienteId)
            ]);

            if (!cliente) {
                throw new Error(`Cliente con ID ${clienteId} no encontrado.`);
            }

            const fechaActual = new Date();
            let score = 500; // Puntaje Base

            // Desglose detallado de puntos
            const desglose = {
                base: 500,
                pagadosATiempo: 0,
                prestamosVencidos: 0,
                cuotasVencidas: 0,
                ahorros: 0,
                antiguedad: 0
            };

            const detalles = {
                prestamosPagadosATiempoCount: 0,
                prestamosVencidosCount: 0,
                cuotasAtrasadasCount: 0,
                cuotasAtrasadas30Count: 0,
                ahorroSaldo: cuentaAhorro ? parseFloat(cuentaAhorro.saldo_actual || 0) : 0,
                antiguedadMeses: 0
            };

            const consejos = [];

            // --- 2. ANTIGÜEDAD DE CUENTA DEL CLIENTE (+50 pts) ---
            if (cliente.created_at) {
                const fechaRegistro = new Date(cliente.created_at);
                const diffTime = Math.abs(fechaActual - fechaRegistro);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffMonths = diffDays / 30.41; // Promedio de días por mes
                
                detalles.antiguedadMeses = Math.floor(diffMonths);

                if (diffMonths > 6) {
                    desglose.antiguedad = 50;
                } else {
                    consejos.push("Mantén tu cuenta activa para obtener +50 puntos de antigüedad cuando superes los 6 meses de registro.");
                }
            }

            // --- 3. SALDO EN CUENTA DE AHORROS (+10 pts por cada 100k, Máx +100 pts) ---
            if (cuentaAhorro && cuentaAhorro.saldo_actual) {
                const saldo = parseFloat(cuentaAhorro.saldo_actual);
                const puntosPorSaldo = Math.floor(saldo / 100000) * 10;
                desglose.ahorros = Math.min(100, puntosPorSaldo);
                
                if (desglose.ahorros < 100) {
                    const faltante = 100000 - (saldo % 100000);
                    consejos.push(`Ahorra $${Math.ceil(faltante).toLocaleString('es-CO')} COP más en tu cuenta de ahorros para obtener +10 puntos adicionales.`);
                }
            } else {
                consejos.push("Abre una Cuenta de Ahorro y deposita fondos para sumar hasta +100 puntos en tu score crediticio.");
            }

            // --- 4. PRÉSTAMOS PAGADOS A TIEMPO Y MORAS ---
            // Separar préstamos por estado
            const prestamosPagados = prestamos.filter(p => p.estado === 'pagado');
            const prestamosActivos = prestamos.filter(p => p.estado !== 'pagado');

            // Evaluar préstamos pagados a tiempo (+100 pts por cada uno, Máx +300 pts)
            for (let p of prestamosPagados) {
                const pagos = await PagoModel.obtenerHistorial(p.id);
                if (pagos.length > 0) {
                    // Obtener la fecha del último abono
                    const ultimasFechas = pagos.map(pag => new Date(pag.fecha_pago));
                    const ultimoAbonoDate = new Date(Math.max.apply(null, ultimasFechas));
                    const fechaFinDate = new Date(p.fecha_fin);

                    // Ajustar para comparar solo día/mes/año (margen de tolerancia de 24 horas por diferencias horarias del servidor)
                    ultimoAbonoDate.setHours(0,0,0,0);
                    fechaFinDate.setHours(23,59,59,999);

                    if (ultimoAbonoDate <= fechaFinDate) {
                        detalles.prestamosPagadosATiempoCount++;
                    }
                }
            }
            desglose.pagadosATiempo = Math.min(300, detalles.prestamosPagadosATiempoCount * 100);

            // Evaluar préstamos activos vencidos (-200 pts por cada uno)
            detalles.prestamosVencidosCount = prestamosActivos.filter(p => p.estado === 'vencido').length;
            desglose.prestamosVencidos = detalles.prestamosVencidosCount > 0 ? -(detalles.prestamosVencidosCount * 200) : 0;

            if (detalles.prestamosVencidosCount > 0) {
                consejos.push(`Atención: Tienes ${detalles.prestamosVencidosCount} préstamo(s) vencido(s). Contacta a la administración para resolver tu estado de mora.`);
            }

            // Evaluar cuotas activas vencidas (a la fecha actual en cronogramas dinámicos)
            let penalizacionCuotas = 0;
            for (let p of prestamosActivos) {
                const pagos = await PagoModel.obtenerHistorial(p.id);
                const totalPagado = pagos.reduce((acc, pago) => acc + parseFloat(pago.monto_pagado), 0);
                
                // Calcular cronograma dinámico
                const cronograma = finance.calcularCronograma(parseFloat(p.monto_total), p.cuotas, p.frecuencia, p.fecha_inicio);
                
                let saldoPagado = totalPagado;
                
                for (let cuota of cronograma) {
                    const montoCuota = parseFloat(cuota.monto);
                    const fechaCuota = new Date(cuota.fecha);
                    
                    let pagadoDeEstaCuota = 0;
                    if (saldoPagado >= (montoCuota - 0.01)) {
                        pagadoDeEstaCuota = montoCuota;
                        saldoPagado -= montoCuota;
                    } else {
                        pagadoDeEstaCuota = saldoPagado;
                        saldoPagado = 0;
                    }

                    // Si la cuota ya venció a la fecha actual y no se cubrió por completo
                    if (pagadoDeEstaCuota < (montoCuota - 0.01) && fechaCuota < fechaActual) {
                        const diffTime = Math.abs(fechaActual - fechaCuota);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 30) {
                            detalles.cuotasAtrasadas30Count++;
                            penalizacionCuotas += 100;
                        } else {
                            detalles.cuotasAtrasadasCount++;
                            penalizacionCuotas += 50;
                        }
                    }
                }
            }
            desglose.cuotasVencidas = penalizacionCuotas > 0 ? -penalizacionCuotas : 0;

            if (detalles.cuotasAtrasadasCount > 0 || detalles.cuotasAtrasadas30Count > 0) {
                const totalCuotasVencidas = detalles.cuotasAtrasadasCount + detalles.cuotasAtrasadas30Count;
                consejos.push(`Ponte al día con tus ${totalCuotasVencidas} cuota(s) vencida(s) para recuperar hasta ${penalizacionCuotas} puntos restados de tu score.`);
            }

            // --- 5. CÁLCULO FINAL Y ACOTAMIENTO ---
            score = 500 + desglose.pagadosATiempo + desglose.ahorros + desglose.antiguedad + desglose.prestamosVencidos + desglose.cuotasVencidas;
            score = Math.max(0, Math.min(1000, score));

            // --- 6. DETERMINACIÓN DE CATEGORÍA, RIESGO Y COLORES ---
            let categoria = 'C';
            let nivel = 'Regular';
            let claseColor = 'text-warning'; // Bootstrap text-warning
            let badgeBg = 'bg-warning';
            let circularColor = '#f59e0b'; // Amber

            if (score >= 900) {
                categoria = 'A';
                nivel = 'Excelente';
                claseColor = 'text-success';
                badgeBg = 'bg-success';
                circularColor = '#10b981'; // Emerald
            } else if (score >= 700) {
                categoria = 'B';
                nivel = 'Bueno';
                claseColor = 'text-info';
                badgeBg = 'bg-info';
                circularColor = '#3b82f6'; // Blue
            } else if (score >= 500) {
                categoria = 'C';
                nivel = 'Regular';
                claseColor = 'text-warning';
                badgeBg = 'bg-warning';
                circularColor = '#f59e0b'; // Amber
            } else if (score >= 300) {
                categoria = 'D';
                nivel = 'Malo';
                claseColor = 'text-danger';
                badgeBg = 'bg-danger';
                circularColor = '#f87171'; // Red suave
            } else {
                categoria = 'E';
                nivel = 'Crítico';
                claseColor = 'text-danger';
                badgeBg = 'bg-danger';
                circularColor = '#dc2626'; // Red fuerte
            }

            // Consejos generales basados en el score final
            if (score >= 900) {
                consejos.unshift("¡Felicidades! Mantienes un comportamiento de pago excelente y ahorros constantes. Eres un cliente VIP.");
            } else if (score >= 700) {
                consejos.unshift("¡Buen trabajo! Tienes un perfil crediticio sólido. Sigue así para llegar a la categoría Excelente.");
            } else if (score < 500) {
                consejos.unshift("Tu perfil crediticio requiere atención urgente. Evita atrasos en tus cuotas y aumenta tu ahorro.");
            }

            return {
                score,
                categoria,
                nivel,
                claseColor,
                badgeBg,
                circularColor,
                desglose,
                detalles,
                consejos,
                fechaCalculo: fechaActual
            };

        } catch (error) {
            console.error("Error al calcular el Score Crediticio del cliente:", error);
            throw error;
        }
    },

    /**
     * Determina la tasa de interés y de mora sugeridas según el score crediticio.
     * Las tasas son mensuales y sirven como guía al administrador; siempre son editables.
     * Regla: tasaMora = tasaMensual + 1% (mora siempre 1 punto porcentual mayor al interés).
     *
     * | Categoría | Score     | Tasa mensual | Tasa mora |
     * |-----------|-----------|-------------|-----------|
     * | A         | 900-1000  | 1.5 %       | 2.5 %     |
     * | B         | 700-899   | 2.0 %       | 3.0 %     |
     * | C         | 500-699   | 2.5 %       | 3.5 %     |
     * | D         | 300-499   | 3.0 %       | 4.0 %     |
     * | E         | 0-299     | 3.5 %       | 4.5 %     |
     *
     * @param {number} score - Puntaje crediticio del cliente (0-1000).
     * @returns {{ tasaMensual: number, tasaMora: number, categoria: string, descripcion: string }}
     */
    obtenerTasaPorScore: (score) => {
        /** @type {{ tasaMensual: number, categoria: string, descripcion: string }} */
        let resultado;

        if (score >= 900) {
            resultado = { tasaMensual: 1.5, categoria: 'A', descripcion: 'Tasa Preferencial (Score Excelente)' };
        } else if (score >= 700) {
            resultado = { tasaMensual: 2.0, categoria: 'B', descripcion: 'Tasa Estándar Reducida (Score Bueno)' };
        } else if (score >= 500) {
            resultado = { tasaMensual: 2.5, categoria: 'C', descripcion: 'Tasa Estándar (Score Regular)' };
        } else if (score >= 300) {
            resultado = { tasaMensual: 3.0, categoria: 'D', descripcion: 'Tasa Elevada (Score Malo)' };
        } else {
            resultado = { tasaMensual: 3.5, categoria: 'E', descripcion: 'Tasa Máxima (Score Crítico)' };
        }

        // Mora siempre 1 punto porcentual mayor a la tasa mensual
        resultado.tasaMora = parseFloat((resultado.tasaMensual + 1).toFixed(2));

        return resultado;
    }
};

module.exports = scoringService;
