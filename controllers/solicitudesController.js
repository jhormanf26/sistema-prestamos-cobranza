const SolicitudCreditoModel = require('../models/SolicitudCreditoModel');
const PrestamoModel = require('../models/PrestamoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const BitacoraModel = require('../models/BitacoraModel');
const emailService = require('../utils/emailService');
const pushService = require('../utils/pushService');
const pdfService = require('../utils/pdfService');
const finance = require('../utils/finance');

/**
 * @fileoverview Controlador para auditar y procesar las solicitudes de crédito pre-aprobado por clientes.
 */

const solicitudesController = {
    /**
     * Lista todas las solicitudes de crédito pendientes de verificación.
     * @param {Object} req Objeto de petición Express.
     * @param {Object} res Objeto de respuesta Express.
     * @returns {Promise<void>}
     */
    listar: async (req, res) => {
        try {
            const pendientes = await SolicitudCreditoModel.obtenerPendientes();
            const config = await ConfigModel.obtener();
            res.render('solicitudes/index', {
                title: 'Solicitudes de Crédito',
                pendientes,
                empresa: config || { moneda: '$' },
                activePage: 'solicitudes'
            });
        } catch (error) {
            console.error("Error en solicitudesController.listar:", error);
            res.status(500).send('Error al cargar solicitudes pendientes');
        }
    },

    /**
     * Procesa la aprobación o rechazo de una solicitud de crédito pre-aprobado.
     * Si es aprobada, crea el préstamo real con los parámetros finales (modificables).
     * @param {Object} req Objeto de petición Express.
     * @param {Object} res Objeto de respuesta Express.
     * @returns {Promise<void>}
     */
    procesar: async (req, res) => {
        const { id } = req.params;
        const { estado, monto, cuotas, frecuencia, interes, interes_mora, comentarios, fecha_inicio } = req.body;
        const usuarioActual = req.session.usuario || { id: 1, nombre: 'Administrador' };

        try {
            // 1. Obtener la solicitud
            const solicitud = await SolicitudCreditoModel.obtenerPorId(id);
            if (!solicitud) {
                return res.status(404).json({ success: false, error: 'Solicitud de crédito no encontrada' });
            }

            if (solicitud.estado !== 'pendiente') {
                return res.status(400).json({ success: false, error: 'Esta solicitud ya ha sido procesada anteriormente' });
            }

            if (estado === 'aprobado') {
                // Validación de campos
                if (!monto || parseFloat(monto) <= 0) {
                    return res.status(400).json({ success: false, error: 'El monto aprobado debe ser mayor a cero' });
                }
                if (!cuotas || parseInt(cuotas) <= 0) {
                    return res.status(400).json({ success: false, error: 'El número de cuotas debe ser mayor a cero' });
                }
                if (!frecuencia) {
                    return res.status(400).json({ success: false, error: 'Debe especificar la frecuencia de cobro' });
                }

                const config = await ConfigModel.obtener();
                const tasaGlobal = config ? parseFloat(config.interes_global) || 0 : 0;
                
                const montoAprobado = parseFloat(monto);
                const numCuotas = parseInt(cuotas);
                const frecuenciaAprobada = frecuencia;
                const tasaMensual = parseFloat(interes) !== undefined && interes !== '' ? parseFloat(interes) : tasaGlobal;
                const tasaMoraMensual = parseFloat(interes_mora) !== undefined && interes_mora !== '' ? parseFloat(interes_mora) : 0;
                const fechaIniStr = fecha_inicio || new Date().toISOString().split('T')[0];

                // Calcular el interés y el monto total
                const tasaTotal = finance.calcularInteresTotal(tasaMensual, numCuotas, frecuenciaAprobada);
                const montoInteres = montoAprobado * (tasaTotal / 100);
                const montoTotal = montoAprobado + montoInteres;

                // Calcular fecha de finalización
                let fechaFin = new Date(fechaIniStr + 'T00:00:00');
                if (frecuenciaAprobada === 'diario') fechaFin.setDate(fechaFin.getDate() + numCuotas);
                else if (frecuenciaAprobada === 'semanal') fechaFin.setDate(fechaFin.getDate() + (numCuotas * 7));
                else if (frecuenciaAprobada === 'quincenal') fechaFin.setDate(fechaFin.getDate() + (numCuotas * 15));
                else if (frecuenciaAprobada === 'mensual') fechaFin.setMonth(fechaFin.getMonth() + numCuotas);
                else if (frecuenciaAprobada === 'bimensual') fechaFin.setMonth(fechaFin.getMonth() + (numCuotas * 2));
                else if (frecuenciaAprobada === 'trimensual') fechaFin.setMonth(fechaFin.getMonth() + (numCuotas * 3));

                // 2. Resolver la solicitud en la base de datos
                await SolicitudCreditoModel.resolverSolicitud(
                    id, 
                    'aprobado', 
                    comentarios || `Solicitud aprobada y desembolsada (Solicitud #${id})`, 
                    usuarioActual.id, 
                    montoAprobado, 
                    numCuotas, 
                    frecuenciaAprobada
                );

                // 3. Crear el Préstamo real en la base de datos
                const resultPrestamo = await PrestamoModel.crear({
                    cliente_id: solicitud.cliente_id,
                    monto_prestado: montoAprobado,
                    tasa_interes: tasaMensual,
                    tasa_mora: tasaMoraMensual,
                    monto_total: montoTotal,
                    cuotas: numCuotas,
                    frecuencia: frecuenciaAprobada,
                    fecha_inicio: fechaIniStr,
                    fecha_fin: fechaFin.toISOString().split('T')[0],
                    observaciones: comentarios || `Desembolso originado por Solicitud de Cupo Pre-aprobado #${id}`
                });

                // 4. Registrar en la bitácora
                await BitacoraModel.registrar(
                    usuarioActual.nombre,
                    'APROBAR_SOLICITUD_CUPO',
                    `Solicitud #${id} aprobada. Préstamo #${resultPrestamo.insertId} creado por $ ${montoAprobado} para el cliente ID: ${solicitud.cliente_id}`
                );

                // 5. Notificar por Correo Electrónico (Nodemailer) al cliente
                const cliente = await ClienteModel.obtenerPorId(solicitud.cliente_id);
                if (cliente && cliente.email) {
                    try {
                        const simboloMoneda = config ? config.moneda : '$';
                        const { asunto, html, adjuntos_config } = await emailService.plantillaPrestamo(
                            `${cliente.nombre} ${cliente.apellido}`,
                            montoAprobado,
                            numCuotas,
                            montoTotal,
                            simboloMoneda,
                            cliente.dni
                        );

                        const attachments = [];

                        if (adjuntos_config && adjuntos_config.enviar_pdf) {
                            const pdfPromesas = [];
                            const pdfNombres = [];

                            if (adjuntos_config.pdfs.includes('contrato')) {
                                pdfPromesas.push(pdfService.generarContratoBuffer(resultPrestamo.insertId));
                                pdfNombres.push('Contrato.pdf');
                            }
                            if (adjuntos_config.pdfs.includes('ticket')) {
                                pdfPromesas.push(pdfService.generarTicketDesembolsoBuffer(resultPrestamo.insertId));
                                pdfNombres.push('Ticket.pdf');
                            }
                            if (adjuntos_config.pdfs.includes('cronograma')) {
                                pdfPromesas.push(pdfService.generarCronogramaBuffer(resultPrestamo.insertId));
                                pdfNombres.push('Cronograma.pdf');
                            }

                            const pdfBuffers = await Promise.all(pdfPromesas);
                            pdfBuffers.forEach((buffer, index) => {
                                attachments.push({ filename: pdfNombres[index], content: buffer });
                            });
                        } else if (!adjuntos_config) {
                            const [pdfContrato, pdfTicket, pdfCronograma] = await Promise.all([
                                pdfService.generarContratoBuffer(resultPrestamo.insertId),
                                pdfService.generarTicketDesembolsoBuffer(resultPrestamo.insertId),
                                pdfService.generarCronogramaBuffer(resultPrestamo.insertId)
                            ]);
                            attachments.push({ filename: 'Contrato.pdf', content: pdfContrato });
                            attachments.push({ filename: 'Ticket.pdf', content: pdfTicket });
                            attachments.push({ filename: 'Cronograma.pdf', content: pdfCronograma });
                        }

                        await emailService.enviarCorreo(cliente.email, asunto || '¡Préstamo Aprobado!', html, attachments);
                    } catch (emailError) {
                        console.error("Error al enviar email de confirmación de préstamo:", emailError);
                    }
                }

                // 6. Notificar por Mensaje Push al celular/PC del cliente
                const pushPayload = {
                    title: '¡Crédito Aprobado y Desembolsado! 🎉',
                    body: `Tu solicitud de cupo por $ ${montoAprobado.toLocaleString('es-CO')} ha sido aprobada e ingresada.`,
                    icon: '/icons/icon-192x192.png',
                    data: {
                        url: '/portal-cliente'
                    }
                };
                try {
                    await pushService.sendPushToUser(solicitud.cliente_id, pushPayload);
                } catch (pushError) {
                    console.error("Error al enviar notificación push de solicitud aprobada:", pushError);
                }

                return res.json({ success: true, message: 'Solicitud aprobada y préstamo desembolsado correctamente' });

            } else if (estado === 'rechazado') {
                if (!comentarios || comentarios.trim().length === 0) {
                    return res.status(400).json({ success: false, error: 'Debes ingresar un motivo de rechazo en los comentarios' });
                }

                // 1. Resolver la solicitud como rechazada en la base de datos
                await SolicitudCreditoModel.resolverSolicitud(id, 'rechazado', comentarios, usuarioActual.id);

                // 2. Registrar en la bitácora
                await BitacoraModel.registrar(
                    usuarioActual.nombre,
                    'RECHAZAR_SOLICITUD_CUPO',
                    `Solicitud de crédito #${id} rechazada para el cliente ID: ${solicitud.cliente_id}. Motivo: ${comentarios}`
                );

                // 3. Notificar por Mensaje Push al cliente
                const pushPayload = {
                    title: 'Solicitud de Crédito Declinada ⚠️',
                    body: `Tu solicitud de crédito no pudo ser procesada. Motivo: ${comentarios}`,
                    icon: '/icons/icon-192x192.png',
                    data: {
                        url: '/portal-cliente'
                    }
                };
                try {
                    await pushService.sendPushToUser(solicitud.cliente_id, pushPayload);
                } catch (pushError) {
                    console.error("Error al enviar notificación push de solicitud rechazada:", pushError);
                }

                return res.json({ success: true, message: 'Solicitud rechazada y notificada al cliente' });
            } else {
                return res.status(400).json({ success: false, error: 'Estado inválido' });
            }

        } catch (error) {
            console.error("Error en solicitudesController.procesar:", error);
            res.status(500).json({ success: false, error: 'Ocurrió un error en el servidor al procesar la solicitud' });
        }
    }
};

module.exports = solicitudesController;
