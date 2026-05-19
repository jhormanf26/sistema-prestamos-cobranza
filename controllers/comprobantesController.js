const ReportePagoModel = require('../models/ReportePagoModel');
const PrestamoModel = require('../models/PrestamoModel');
const PagoModel = require('../models/PagoModel');
const CajaModel = require('../models/CajaModel');
const BitacoraModel = require('../models/BitacoraModel');
const ConfigModel = require('../models/ConfigModel');
const emailService = require('../utils/emailService');
const pushService = require('../utils/pushService');
const { formatCurrency } = require('../utils/formatters');

/**
 * Controlador para auditar y procesar comprobantes de pago de clientes.
 */
const comprobantesController = {
    /**
     * Lista todos los comprobantes de pago pendientes de verificación.
     */
    listar: async (req, res) => {
        try {
            const pendientes = await ReportePagoModel.obtenerPendientes();
            res.render('comprobantes/index', {
                title: 'Verificación de Comprobantes',
                pendientes,
                activePage: 'comprobantes'
            });
        } catch (error) {
            console.error("Error en comprobantesController.listar:", error);
            res.status(500).send('Error al cargar comprobantes pendientes');
        }
    },

    /**
     * Procesa la aprobación o rechazo de un comprobante de pago.
     * Si es aprobado, crea el pago real, el registro en caja y actualiza el saldo del préstamo.
     */
    procesar: async (req, res) => {
        const { id } = req.params;
        const { estado, monto, observaciones } = req.body;
        const usuarioActual = req.session.usuario || { id: 1, nombre: 'Administrador' };

        try {
            const reporte = await ReportePagoModel.obtenerPorId(id);
            if (!reporte) {
                return res.status(404).json({ success: false, error: 'Reporte de pago no encontrado' });
            }

            if (reporte.estado !== 'pendiente') {
                return res.status(400).json({ success: false, error: 'Este comprobante ya ha sido procesado anteriormente' });
            }

            if (estado === 'aprobado') {
                if (!monto || parseFloat(monto) <= 0) {
                    return res.status(400).json({ success: false, error: 'El monto aprobado debe ser mayor a cero' });
                }

                const cleanMonto = parseFloat(monto);
                const prestamo = await PrestamoModel.obtenerPorId(reporte.prestamo_id);
                const totalDeuda = parseFloat(prestamo.monto_total);
                const totalPagado = parseFloat(await PagoModel.obtenerTotalPagado(reporte.prestamo_id));
                const saldoPendiente = totalDeuda - totalPagado;

                if (cleanMonto > (saldoPendiente + 0.01)) {
                    return res.status(400).json({ 
                        success: false, 
                        error: `El monto ingresado ($ ${cleanMonto.toLocaleString('es-CO')}) excede la deuda restante ($ ${saldoPendiente.toLocaleString('es-CO')}).` 
                    });
                }

                // 1. Crear el pago oficial en la base de datos
                await PagoModel.crear({
                    prestamo_id: reporte.prestamo_id,
                    monto_pagado: cleanMonto,
                    observaciones: observaciones || `Abono verificado desde portal de clientes (Comprobante #${id})`
                });

                // 2. Registrar el ingreso en la CAJA para contabilidad
                await CajaModel.registrar({
                    tipo: 'ingreso',
                    monto: cleanMonto,
                    descripcion: `Abono verificado Préstamo #${reporte.prestamo_id} - ${reporte.cliente_nombre} ${reporte.cliente_apellido}`,
                    usuario_id: usuarioActual.id,
                    referencia_id: reporte.prestamo_id,
                    categoria: 'Cobro Préstamo'
                });

                // 3. Liquidar el préstamo si la deuda quedó saldada
                const nuevoTotalPagado = totalPagado + cleanMonto;
                if (nuevoTotalPagado >= (totalDeuda - 0.01)) {
                    await PrestamoModel.actualizarEstado(reporte.prestamo_id, 'pagado');
                }

                // 4. Actualizar el reporte de pago a 'aprobado'
                await ReportePagoModel.resolverReporte(id, 'aprobado', observaciones, usuarioActual.id, cleanMonto);

                // 5. Registrar en la bitácora general de auditoría
                await BitacoraModel.registrar(
                    usuarioActual.nombre,
                    'APROBAR_COMPROBANTE',
                    `Comprobante #${id} aprobado con abono de $ ${cleanMonto} para el préstamo #${reporte.prestamo_id}`
                );

                // 6. Notificar por Correo Electrónico (Nodemailer) al cliente
                if (prestamo.email) {
                    try {
                        const config = await ConfigModel.obtener();
                        const simboloMoneda = config ? config.moneda : '$';
                        const nuevoSaldo = saldoPendiente - cleanMonto;
                        
                        const { asunto: asuntoBD, html: contenidoHTML } = await emailService.plantillaPago(
                            `${reporte.cliente_nombre} ${reporte.cliente_apellido}`,
                            cleanMonto,
                            new Date(),
                            nuevoSaldo,
                            simboloMoneda
                        );

                        const asunto = asuntoBD || 'Recibo de Pago Confirmado - Portal Clientes';
                        emailService.enviarCorreo(prestamo.email, asunto, contenidoHTML);
                    } catch (emailError) {
                        console.error("Error al enviar email de recibo al cliente:", emailError);
                    }
                }

                // 7. Notificar por Mensaje Push al celular/PC del cliente
                const pushPayload = {
                    title: '¡Abono Aprobado! 🎉',
                    body: `Tu abono de $ ${cleanMonto.toLocaleString('es-CO')} ha sido verificado y aplicado con éxito.`,
                    icon: '/icons/icon-192x192.png',
                    data: {
                        url: '/portal-cliente'
                    }
                };
                try {
                    await pushService.sendPushToUser(reporte.cliente_id, pushPayload);
                } catch (pushError) {
                    console.error("Error al enviar notificación push de abono aprobado:", pushError);
                }

                return res.json({ success: true, message: 'Comprobante aprobado y abono registrado correctamente' });

            } else if (estado === 'rechazado') {
                if (!observaciones || observaciones.trim().length === 0) {
                    return res.status(400).json({ success: false, error: 'Debes ingresar un motivo de rechazo en las observaciones' });
                }

                // 1. Actualizar el reporte de pago a 'rechazado'
                await ReportePagoModel.resolverReporte(id, 'rechazado', observaciones, usuarioActual.id);

                // 2. Registrar en la bitácora
                await BitacoraModel.registrar(
                    usuarioActual.nombre,
                    'RECHAZAR_COMPROBANTE',
                    `Comprobante #${id} rechazado para el préstamo #${reporte.prestamo_id}. Motivo: ${observaciones}`
                );

                 // 3. Notificar por Correo Electrónico al cliente si tiene correo registrado
                const prestamo = await PrestamoModel.obtenerPorId(reporte.prestamo_id);
                if (prestamo && prestamo.email) {
                    try {
                        const config = await ConfigModel.obtener();
                        const simboloMoneda = config ? config.moneda : '$';
                        
                        const { asunto: asuntoBD, html: contenidoHTML } = await emailService.plantillaRechazoPago(
                            `${reporte.cliente_nombre} ${reporte.cliente_apellido}`,
                            reporte.monto,
                            reporte.fecha_reporte,
                            observaciones,
                            simboloMoneda
                        );

                        const asunto = asuntoBD || 'Comprobante de Pago Rechazado - Portal Clientes';
                        emailService.enviarCorreo(prestamo.email, asunto, contenidoHTML);
                    } catch (emailError) {
                        console.error("Error al enviar email de rechazo al cliente:", emailError);
                    }
                }

                // 4. Notificar por Mensaje Push
                const pushPayload = {
                    title: 'Comprobante de Pago Rechazado ⚠️',
                    body: `Tu comprobante de pago no pudo ser verificado. Motivo: ${observaciones}`,
                    icon: '/icons/icon-192x192.png',
                    data: {
                        url: '/portal-cliente'
                    }
                };
                try {
                    await pushService.sendPushToUser(reporte.cliente_id, pushPayload);
                } catch (pushError) {
                    console.error("Error al enviar notificación push de comprobante rechazado:", pushError);
                }

                return res.json({ success: true, message: 'Comprobante rechazado y notificado al cliente' });
            } else {
                return res.status(400).json({ success: false, error: 'Estado inválido' });
            }

        } catch (error) {
            console.error("Error en comprobantesController.procesar:", error);
            res.status(500).json({ success: false, error: 'Ocurrió un error en el servidor al procesar el comprobante' });
        }
    }
};

module.exports = comprobantesController;
