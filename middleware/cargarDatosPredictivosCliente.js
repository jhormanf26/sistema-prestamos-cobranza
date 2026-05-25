const PrestamoModel = require('../models/PrestamoModel');
const PagoModel = require('../models/PagoModel');
const AhorroModel = require('../models/AhorroModel');
const ClienteModel = require('../models/ClienteModel');
const finance = require('../utils/finance');

/**
 * Middleware para la carga de datos financieros predictivos del cliente actual.
 * Analiza el estado del cliente (mora física o lógica, cuotas prontas, contratos por firmar, cupos pre-aprobados, metas de ahorro)
 * e inyecta la información resultante en res.locals.datosPredictivos para que esté disponible en las vistas.
 * 
 * @param {Object} req - Objeto de petición de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función callback para continuar con el siguiente middleware en la ruta.
 * @returns {Promise<void>}
 */
module.exports = async (req, res, next) => {
    // Si no hay una sesión activa de cliente, continuamos sin calcular nada
    if (!req.session || !req.session.cliente) {
        return next();
    }

    try {
        const clienteId = req.session.cliente.id;
        
        // Consultas en paralelo para optimizar el rendimiento
        const [cliente, prestamos, cuentaAhorro] = await Promise.all([
            ClienteModel.obtenerPorId(clienteId),
            PrestamoModel.obtenerPorCliente(clienteId),
            AhorroModel.buscarPorCliente(clienteId)
        ]);

        const prestamosActivos = prestamos.filter(p => p.estado !== 'pagado');
        const prestamosVencidos = prestamos.filter(p => p.estado === 'vencido');
        const prestamosSinFirmar = prestamosActivos.filter(p => !p.firma_digital);

        let tieneMora = prestamosVencidos.length > 0;
        let cuotaCercana = null;
        let diasParaVencer = null;
        const moraDetalle = [];

        // Inicializar detalle de mora si ya tiene préstamos con estado 'vencido' en la BD
        if (tieneMora) {
            prestamosVencidos.forEach(p => {
                moraDetalle.push({ id: p.id, monto: p.monto_total });
            });
        }

        // Evaluar cuotas de préstamos activos
        for (let p of prestamosActivos) {
            const pagos = await PagoModel.obtenerHistorial(p.id);
            const totalPagado = pagos.reduce((acc, pago) => acc + parseFloat(pago.monto_pagado), 0);
            const proxima = finance.obtenerProximaCuota(p.monto_total, p.cuotas, p.frecuencia, p.fecha_inicio, totalPagado);

            if (proxima) {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                
                // Tratar la fecha de la cuota con T00:00:00 local para evitar desfases de zona horaria
                let fechaVence;
                if (proxima.fecha instanceof Date) {
                    fechaVence = new Date(proxima.fecha);
                } else {
                    fechaVence = new Date(proxima.fecha + 'T00:00:00');
                }
                fechaVence.setHours(0, 0, 0, 0);

                const diffTime = fechaVence - hoy;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // CASO 1: Mora Dinámica -> La fecha de la cuota ya pasó y sigue pendiente
                if (diffDays < 0) {
                    tieneMora = true;
                    // Evitar duplicar el préstamo en la lista si ya estaba catalogado como vencido
                    if (!moraDetalle.some(m => m.id === p.id)) {
                        moraDetalle.push({
                            id: p.id,
                            monto: proxima.restante
                        });
                    }
                } 
                // CASO 2: Cuota Cercana -> Vence en 5 días o menos y no hay mora previa en este préstamo
                else if (diffDays >= 0 && diffDays <= 5) {
                    // Si el préstamo no está en mora, evaluamos si es la cuota más cercana en el tiempo
                    if (!moraDetalle.some(m => m.id === p.id)) {
                        if (cuotaCercana === null || diffDays < diasParaVencer) {
                            cuotaCercana = {
                                prestamoId: p.id,
                                monto: proxima.restante,
                                fecha: proxima.fecha,
                                numero: proxima.numero,
                                diasRestantes: diffDays
                            };
                            diasParaVencer = diffDays;
                        }
                    }
                }
            }
        }

        // Armar el payload predictivo en res.locals
        res.locals.datosPredictivos = {
            tieneMora: tieneMora,
            moraDetalle: moraDetalle,
            cuotaCercana: cuotaCercana,
            contratoPendiente: prestamosSinFirmar.length > 0 ? { id: prestamosSinFirmar[0].id, monto: prestamosSinFirmar[0].monto_prestado } : null,
            cupoPreaprobado: (prestamosActivos.length === 0 && cliente && parseFloat(cliente.monto_preaprobado) > 0) 
                ? parseFloat(cliente.monto_preaprobado) 
                : 0,
            ahorroMeta: (cuentaAhorro && cuentaAhorro.meta_nombre && parseFloat(cuentaAhorro.meta_monto) > 0) ? {
                metaNombre: cuentaAhorro.meta_nombre,
                metaMonto: parseFloat(cuentaAhorro.meta_monto),
                saldoActual: parseFloat(cuentaAhorro.saldo_actual),
                porcentaje: Math.min(100, Math.round((parseFloat(cuentaAhorro.saldo_actual) / parseFloat(cuentaAhorro.meta_monto)) * 100))
            } : null
        };

    } catch (error) {
        console.error("Aviso: Error cargando datos predictivos de cliente en middleware:", error.message);
        // Fallback seguro ante fallos de base de datos
        res.locals.datosPredictivos = {
            tieneMora: false,
            moraDetalle: [],
            cuotaCercana: null,
            contratoPendiente: null,
            cupoPreaprobado: 0,
            ahorroMeta: null
        };
    }

    next();
};
