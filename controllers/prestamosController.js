const PrestamoModel = require('../models/PrestamoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const PagoModel = require('../models/PagoModel'); 
const emailService = require('../utils/emailService');
const finance = require('../utils/finance');
const BitacoraModel = require('../models/BitacoraModel'); 
const pdfService = require('../utils/pdfService');
const { formatCurrency } = require('../utils/formatters');

const prestamosController = {

    listar: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            
            const busqueda = req.query.q || '';
            const sort = req.query.sort || 'id';    
            const order = req.query.order || 'desc'; 

            let prestamos;
            let totalRegistros;

            if (busqueda) {
                prestamos = await PrestamoModel.buscarPaginados(busqueda, limit, offset, sort, order);
                totalRegistros = await PrestamoModel.contarBusqueda(busqueda);
            } else {
                prestamos = await PrestamoModel.obtenerPaginados(limit, offset, sort, order);
                totalRegistros = await PrestamoModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);
            const config = await ConfigModel.obtener();
            const empresaConfig = config || { moneda: '$' };

            res.render('prestamos/index', { 
                title: 'Gestión de Préstamos',
                prestamos,
                busqueda,
                currentPage: page,
                totalPages,
                totalRegistros,
                empresa: empresaConfig,
                sort,
                order
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar los préstamos');
            res.redirect('/');
        }
    },

    mostrarFormulario: async (req, res) => {
        try {
            const [clientes, config] = await Promise.all([
                ClienteModel.obtenerTodos(),
                ConfigModel.obtener()
            ]);
            res.render('prestamos/crear', { 
                title: 'Nuevo Préstamo',
                clientes,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            res.redirect('/prestamos');
        }
    },

    guardar: async (req, res) => {
        try {
            const { cliente_id, monto, interes, cuotas, frecuencia, fecha_inicio, observaciones } = req.body;
            const usuarioActual = (req.session && req.session.usuario) ? req.session.usuario.nombre : 'Administrador';

            const montoPrestado = parseFloat(monto);
            const tasa = parseFloat(interes);
            const numCuotas = parseInt(cuotas);
            const montoInteres = montoPrestado * (tasa / 100);
            const montoTotal = montoPrestado + montoInteres;

            let fechaFin = new Date(fecha_inicio);
            if (frecuencia === 'diario') fechaFin.setDate(fechaFin.getDate() + numCuotas);
            else if (frecuencia === 'semanal') fechaFin.setDate(fechaFin.getDate() + (numCuotas * 7));
            else if (frecuencia === 'mensual') fechaFin.setMonth(fechaFin.getMonth() + numCuotas);

            const result = await PrestamoModel.crear({
                cliente_id, monto_prestado: montoPrestado, tasa_interes: tasa, monto_total: montoTotal, 
                cuotas: numCuotas, frecuencia, fecha_inicio, fecha_fin: fechaFin.toISOString().split('T')[0], 
                observaciones: observaciones || ''
            });

            await BitacoraModel.registrar(usuarioActual, 'NUEVO_PRESTAMO', `Monto: ${montoPrestado} - Cliente ID: ${cliente_id}`);

            const cliente = await ClienteModel.obtenerPorId(cliente_id);
            if (cliente && cliente.email) {
                try {
                    const config = await ConfigModel.obtener();
                    const { asunto, html, adjuntos_config } = await emailService.plantillaPrestamo(`${cliente.nombre} ${cliente.apellido}`, montoPrestado, numCuotas, montoTotal, config ? config.moneda : '$');
                    
                    const attachments = [];
                    
                    // Si hay configuración y se desea enviar PDF
                    if (adjuntos_config && adjuntos_config.enviar_pdf) {
                        const pdfPromesas = [];
                        const pdfNombres = [];

                        if (adjuntos_config.pdfs.includes('contrato')) {
                            pdfPromesas.push(pdfService.generarContratoBuffer(result.insertId));
                            pdfNombres.push('Contrato.pdf');
                        }
                        if (adjuntos_config.pdfs.includes('ticket')) {
                            pdfPromesas.push(pdfService.generarTicketDesembolsoBuffer(result.insertId));
                            pdfNombres.push('Ticket.pdf');
                        }
                        if (adjuntos_config.pdfs.includes('cronograma')) {
                            pdfPromesas.push(pdfService.generarCronogramaBuffer(result.insertId));
                            pdfNombres.push('Cronograma.pdf');
                        }

                        const pdfBuffers = await Promise.all(pdfPromesas);
                        pdfBuffers.forEach((buffer, index) => {
                            attachments.push({ filename: pdfNombres[index], content: buffer });
                        });

                    } else if (!adjuntos_config) {
                        // Comportamiento por defecto si no existe configuración (enviar todos)
                        const [pdfContrato, pdfTicket, pdfCronograma] = await Promise.all([
                            pdfService.generarContratoBuffer(result.insertId),
                            pdfService.generarTicketDesembolsoBuffer(result.insertId),
                            pdfService.generarCronogramaBuffer(result.insertId)
                        ]);
                        attachments.push({ filename: 'Contrato.pdf', content: pdfContrato });
                        attachments.push({ filename: 'Ticket.pdf', content: pdfTicket });
                        attachments.push({ filename: 'Cronograma.pdf', content: pdfCronograma });
                    }

                    await emailService.enviarCorreo(cliente.email, asunto || '¡Préstamo Aprobado!', html, attachments);
                } catch (e) { console.error('Email error:', e); }
            }

            req.flash('mensajeExito', 'Préstamo registrado correctamente');
            res.redirect('/prestamos');
        } catch (error) { console.error(error); res.redirect('/prestamos/crear'); }
    },

    verVencidos: async (req, res) => {
        try {
            const [vencidos, config] = await Promise.all([PrestamoModel.obtenerVencidos(), ConfigModel.obtener()]);
            res.render('prestamos/vencidos', { title: 'Reporte de Morosidad', vencidos, empresa: config || { moneda: '$' } });
        } catch (error) { res.redirect('/prestamos'); }
    },

    verCronograma: async (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = await PrestamoModel.obtenerPorId(id);
            if (!prestamo) return res.redirect('/prestamos');
            const pagos = await PagoModel.obtenerHistorial(id);
            let totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.monto_pagado), 0);
            let cronograma = finance.calcularCronograma(parseFloat(prestamo.monto_total), prestamo.cuotas, prestamo.frecuencia, prestamo.fecha_inicio);
            cronograma = cronograma.map(c => {
                const mc = parseFloat(c.monto);
                if (totalPagado >= (mc - 0.1)) { c.estado = 'Pagado'; c.clase = 'success'; totalPagado -= mc; }
                else if (totalPagado > 0) { c.estado = `Parcial (${formatCurrency(mc - totalPagado, 2)})`; c.clase = 'warning'; totalPagado = 0; }
                else { c.estado = 'Programado'; c.clase = 'secondary'; }
                return c;
            });
            const config = await ConfigModel.obtener();
            res.render('prestamos/cronograma', { title: 'Cronograma de Pagos', prestamo, cronograma, empresa: config || { moneda: '$' } });
        } catch (error) { res.redirect('/prestamos'); }
    },

    descargarCronograma: async (req, res) => {
        try {
            const { id } = req.params;
            const buffer = await pdfService.generarCronogramaBuffer(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Cronograma_Prestamo_${id}.pdf`);
            res.send(buffer);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al generar el PDF del cronograma');
        }
    },

    descargarContrato: async (req, res) => {
        try {
            const { id } = req.params;
            const buffer = await pdfService.generarContratoBuffer(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Contrato_Prestamo_${id}.pdf`);
            res.send(buffer);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al generar el PDF del contrato');
        }
    },

    descargarTicket: async (req, res) => {
        try {
            const { id } = req.params;
            const buffer = await pdfService.generarTicketDesembolsoBuffer(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Ticket_Prestamo_${id}.pdf`);
            res.send(buffer);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al generar el PDF del ticket');
        }
    },

    enviarRecordatorio: async (req, res) => {
        try {
            const { id } = req.params;
            const prestamo = await PrestamoModel.obtenerPorId(id);
            if (!prestamo || !prestamo.email) {
                return res.json({ success: false, mensaje: 'El cliente no tiene correo registrado.' });
            }

            const config = await ConfigModel.obtener();
            const { asunto, html } = await emailService.plantillaRecordatorio(
                `${prestamo.nombre} ${prestamo.apellido}`,
                prestamo.monto_total,
                prestamo.fecha_fin,
                config ? config.moneda : '$'
            );

            await emailService.enviarCorreo(prestamo.email, asunto || 'Recordatorio de Pago', html);
            
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.json({ success: false, mensaje: 'Error interno del servidor.' });
        }
    }
};

module.exports = prestamosController;