const ClienteModel = require('../models/ClienteModel');
const PrestamoModel = require('../models/PrestamoModel');
const AhorroModel = require('../models/AhorroModel');
const EmpenoModel = require('../models/EmpenoModel');
const PagoModel = require('../models/PagoModel');
const ReportePagoModel = require('../models/ReportePagoModel');
const SolicitudCreditoModel = require('../models/SolicitudCreditoModel');
const SoporteMensajeModel = require('../models/SoporteMensajeModel');
const AhorroReporteModel = require('../models/AhorroReporteModel');
const AhorroSolicitudModel = require('../models/AhorroSolicitudModel');
const ConfigModel = require('../models/ConfigModel');
const finance = require('../utils/finance');
const bcrypt = require('bcryptjs');

const portalClienteController = {
    // Mostrar formulario de login
    mostrarLogin: (req, res) => {
        if (req.session.cliente) {
            return res.redirect('/portal-cliente');
        }
        res.render('portal-cliente/login', { layout: false });
    },

    // Procesar Login
    login: async (req, res) => {
        const { dni, password } = req.body;

        try {
            const cliente = await ClienteModel.buscarPorDNI(dni);

            if (!cliente) {
                req.flash('mensajeError', 'DNI o contraseña incorrectos');
                return res.redirect('/portal-cliente/login');
            }

            // Verificar si el cliente tiene contraseña (los antiguos podrían no tenerla, en caso que no haya corrido el script)
            if (!cliente.password) {
                req.flash('mensajeError', 'Tu cuenta requiere actualización. Contacta a administración.');
                return res.redirect('/portal-cliente/login');
            }

            const passwordValido = await bcrypt.compare(password, cliente.password);

            if (!passwordValido) {
                req.flash('mensajeError', 'DNI o contraseña incorrectos');
                return res.redirect('/portal-cliente/login');
            }

            // Si está inactivo no entra
            if (cliente.estado === 0) {
                req.flash('mensajeError', 'Tu cuenta está inactiva. Contacta a administración.');
                return res.redirect('/portal-cliente/login');
            }

            // Actualizar el último login
            try {
                await ClienteModel.actualizarUltimoLogin(cliente.id);
            } catch (e) {
                console.error("Error al actualizar ultimo login del cliente:", e);
            }

            // Crear Sesión
            req.session.cliente = {
                id: cliente.id,
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                dni: cliente.dni,
                foto: cliente.foto
            };

            res.redirect('/portal-cliente');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error en el servidor');
            res.redirect('/portal-cliente/login');
        }
    },

    // Cerrar Sesión
    logout: (req, res) => {
        req.session.destroy(() => {
            res.redirect('/portal-cliente/login');
        });
    },

    // Dashboard Cliente
    dashboard: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const empresa = await ConfigModel.obtener();
            const cliente = await ClienteModel.obtenerPorId(clienteId);
            const prestamos = await PrestamoModel.obtenerPorCliente(clienteId);
            
            // Auto-reparación proactiva: Si un préstamo está activo pero ya se pagó en su totalidad, lo liquidamos en la base de datos
            for (let p of prestamos) {
                if (p.estado !== 'pagado') {
                    const totalPagado = parseFloat(p.total_pagado || 0);
                    const totalDeuda = parseFloat(p.monto_total || 0);
                    if (totalPagado >= (totalDeuda - 0.01)) {
                        await PrestamoModel.actualizarEstado(p.id, 'pagado');
                        p.estado = 'pagado';
                    }
                }
            }

            const cuentaAhorro = await AhorroModel.buscarPorCliente(clienteId);
            const empenos = await EmpenoModel.obtenerPorCliente(clienteId);
            const reportesPago = await ReportePagoModel.obtenerPorCliente(clienteId);
            const reportesAporte = await AhorroReporteModel.obtenerPorCliente(clienteId);
            const solicitudesRetiro = await AhorroSolicitudModel.obtenerPorCliente(clienteId);
            const movimientosAhorro = cuentaAhorro ? await AhorroModel.obtenerMovimientos(cuentaAhorro.id) : [];
            
            // Separar préstamos por estado para facilidad
            const prestamosActivos = prestamos.filter(p => p.estado !== 'pagado');
            const prestamosPagados = prestamos.filter(p => p.estado === 'pagado');

            // Calcular próxima cuota para préstamos activos
            for (let p of prestamosActivos) {
                const pagos = await PagoModel.obtenerHistorial(p.id);
                p.pagos = pagos; // Guardamos el historial de pagos reales para la vista colapsable
                const totalPagado = pagos.reduce((acc, pago) => acc + parseFloat(pago.monto_pagado), 0);
                const proxima = finance.obtenerProximaCuota(p.monto_total, p.cuotas, p.frecuencia, p.fecha_inicio, totalPagado);
                if (proxima) {
                    p.fecha_proxima_cuota = proxima.fecha;
                    p.monto_proxima_cuota = proxima.monto;
                    p.restante_proxima_cuota = proxima.restante;
                    p.numero_proxima_cuota = proxima.numero;
                } else {
                    p.fecha_proxima_cuota = null;
                    p.monto_proxima_cuota = null;
                    p.restante_proxima_cuota = null;
                    p.numero_proxima_cuota = null;
                }
            }

            // Obtener historial de pagos para préstamos cancelados/pagados
            for (let p of prestamosPagados) {
                p.pagos = await PagoModel.obtenerHistorial(p.id);
            }

            res.render('portal-cliente/dashboard', {
                title: 'Mi Portal',
                empresa,
                cliente,
                prestamosActivos,
                prestamosPagados,
                prestamos, // Enviamos todos para compatibilidad si la vista lo requiere
                cuentaAhorro,
                empenos,
                reportesPago,
                reportesAporte,
                solicitudesRetiro,
                movimientosAhorro,
                manifestPath: '/manifest-cliente.json',
                themeColor: '#10b981'
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al cargar el dashboard del cliente');
        }
    },

    // Mostrar Perfil
    perfil: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const cliente = await ClienteModel.obtenerPorId(clienteId);
            res.render('portal-cliente/perfil', {
                title: 'Mi Perfil',
                cliente,
                manifestPath: '/manifest-cliente.json',
                themeColor: '#10b981'
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al cargar el perfil');
        }
    },

    // Actualizar Password Cliente desde su portal
    actualizarPassword: async (req, res) => {
        const { passwordActual, nuevoPassword } = req.body;
        const clienteId = req.session.cliente.id;

        try {
            const cliente = await ClienteModel.obtenerPorId(clienteId);
            const passwordValido = await bcrypt.compare(passwordActual, cliente.password);

            if (!passwordValido) {
                req.flash('mensajeError', 'La contraseña actual es incorrecta');
                return res.redirect('/portal-cliente/perfil');
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(nuevoPassword, salt);
            
            await ClienteModel.actualizarPassword(clienteId, hash);
            
            req.flash('mensajeExito', 'Contraseña actualizada correctamente');
            res.redirect('/portal-cliente/perfil');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar contraseña');
            res.redirect('/portal-cliente/perfil');
        }
    },

    // Registrar instalación de App
    registrarInstalacion: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            await ClienteModel.registrarAppInstalada(clienteId);
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false });
        }
    },

    // 1. Reportar abono subiendo comprobante
    reportarPago: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const { prestamo_id, monto, observaciones } = req.body;

            let comprobanteUrl = null;
            if (req.file) {
                comprobanteUrl = `/uploads/${req.file.filename}`;
            }

            if (!prestamo_id || !monto) {
                req.flash('mensajeError', 'El préstamo y el monto son requeridos.');
                return res.redirect('/portal-cliente');
            }

            // Limpiar formato de moneda estilo Colombia (quitar puntos de miles)
            const cleanMonto = parseFloat(monto.toString().replace(/\./g, '').replace(/,/g, '.').trim());

            if (isNaN(cleanMonto) || cleanMonto <= 0) {
                req.flash('mensajeError', 'Monto inválido.');
                return res.redirect('/portal-cliente');
            }

            // comprobanteUrl ya está asignado arriba

            await ReportePagoModel.crear({
                prestamo_id: parseInt(prestamo_id),
                cliente_id: clienteId,
                monto: cleanMonto,
                comprobante_url: comprobanteUrl,
                observaciones: observaciones || null
            });

            // Notificar a los administradores
            const { sendPushToAdmins } = require('../utils/pushService');
            sendPushToAdmins({
                title: `💰 Nuevo Reporte de Pago`,
                body: `${req.session.cliente.nombre || 'Un cliente'} ha subido un comprobante por $${cleanMonto.toLocaleString('es-CO')}.`,
                icon: '/img/icon-192.png',
                url: '/reportes'
            }).catch(e => console.error('Error enviando push de reporte:', e));

            req.flash('mensajeExito', 'Comprobante reportado con éxito. Está en espera de verificación.');
            res.redirect('/portal-cliente');
        } catch (error) {
            console.error("Error en portalClienteController.reportarPago:", error);
            req.flash('mensajeError', 'Ocurrió un error al procesar tu comprobante.');
            res.redirect('/portal-cliente');
        }
    },

    // 2. Solicitar préstamo usando cupo pre-aprobado (Fidelización)
    solicitarCupo: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const { monto_solicitado, cuotas, frecuencia } = req.body;

            if (!monto_solicitado || !cuotas) {
                req.flash('mensajeError', 'El monto y las cuotas son requeridos.');
                return res.redirect('/portal-cliente');
            }

            // Limpiar formato de moneda estilo Colombia (quitar puntos)
            const cleanMonto = parseFloat(monto_solicitado.toString().replace(/\./g, '').replace(/,/g, '.').trim());

            if (isNaN(cleanMonto) || cleanMonto <= 0) {
                req.flash('mensajeError', 'Monto solicitado inválido.');
                return res.redirect('/portal-cliente');
            }

            const cliente = await ClienteModel.obtenerPorId(clienteId);

            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado.');
                return res.redirect('/portal-cliente');
            }

            const cupoDisponible = parseFloat(cliente.monto_preaprobado || 0);

            if (cleanMonto > cupoDisponible) {
                req.flash('mensajeError', `El monto solicitado excede tu cupo pre-aprobado disponible ($ ${cupoDisponible.toLocaleString('es-CO')}).`);
                return res.redirect('/portal-cliente');
            }

            await SolicitudCreditoModel.crear({
                cliente_id: clienteId,
                monto_solicitado: cleanMonto,
                cuotas: parseInt(cuotas),
                frecuencia: frecuencia || 'quincenal' // por defecto
            });

            // Notificar a los administradores
            const { sendPushToAdmins } = require('../utils/pushService');
            sendPushToAdmins({
                title: `🚀 Nueva Solicitud de Desembolso`,
                body: `${req.session.cliente.nombre || 'Un cliente'} ha solicitado un cupo rápido por $${cleanMonto.toLocaleString('es-CO')}.`,
                icon: '/img/icon-192.png',
                url: '/solicitudes'
            }).catch(e => console.error('Error enviando push de solicitud:', e));

            req.flash('mensajeExito', 'Tu solicitud de desembolso ha sido enviada con éxito. Un asesor la revisará pronto.');
            res.redirect('/portal-cliente');
        } catch (error) {
            console.error("Error en portalClienteController.solicitarCupo:", error);
            req.flash('mensajeError', 'Error al procesar tu solicitud de cupo.');
            res.redirect('/portal-cliente');
        }
    },

    // 3. Ver chat de soporte
    verChat: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const cliente = await ClienteModel.obtenerPorId(clienteId);

            // Obtener el historial completo
            const mensajes = await SoporteMensajeModel.obtenerChatCompleto(clienteId);

            // Marcar mensajes del administrador como entregados y leídos por el cliente
            await SoporteMensajeModel.marcarComoEntregado(clienteId, 'administrador');
            await SoporteMensajeModel.marcarComoLeido(clienteId, 'administrador');

            res.render('portal-cliente/chat', {
                title: 'Chat de Soporte',
                cliente,
                mensajes,
                manifestPath: '/manifest-cliente.json',
                themeColor: '#10b981'
            });
        } catch (error) {
            console.error("Error en portalClienteController.verChat:", error);
            res.status(500).send('Error al cargar el chat de soporte');
        }
    },

    // 4. Enviar un mensaje de chat
    enviarMensajeChat: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const { mensaje } = req.body;

            if (!mensaje || mensaje.trim().length === 0) {
                if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                    return res.status(400).json({ success: false, error: 'Mensaje vacío' });
                }
                return res.redirect('/portal-cliente/chat');
            }

            await SoporteMensajeModel.enviarMensaje({
                cliente_id: clienteId,
                remitente: 'cliente',
                mensaje: mensaje.trim()
            });

            // Notificar a los administradores
            const { sendPushToAdmins } = require('../utils/pushService');
            sendPushToAdmins({
                title: `💬 Nuevo mensaje de ${req.session.cliente.nombre || 'Cliente'}`,
                body: mensaje.trim().length > 50 ? `${mensaje.trim().substring(0, 47)}...` : mensaje.trim(),
                icon: '/img/icon-192.png',
                url: '/soporte'
            }).catch(e => console.error('Error enviando push a admins:', e));

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({ success: true, mensaje: mensaje.trim() });
            }
            res.redirect('/portal-cliente/chat');
        } catch (error) {
            console.error("Error en portalClienteController.enviarMensajeChat:", error);
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(500).json({ success: false, error: 'Error en el servidor' });
            }
            res.redirect('/portal-cliente/chat');
        }
    },

    // Enviar un audio de chat
    enviarAudioChat: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No se recibió ningún archivo de audio válido' });
            }

            // La ruta web para acceder al archivo subido
            const rutaAudio = '/uploads/soporte/' + req.file.filename;

            await SoporteMensajeModel.enviarMensaje({
                cliente_id: clienteId,
                remitente: 'cliente',
                mensaje: rutaAudio,
                tipo: 'audio'
            });

            // Notificar a los administradores
            const { sendPushToAdmins } = require('../utils/pushService');
            sendPushToAdmins({
                title: `🎤 Nota de voz de ${req.session.cliente.nombre || 'Cliente'}`,
                body: 'Envió un mensaje de audio',
                icon: '/img/icon-192.png',
                url: '/soporte'
            }).catch(e => console.error('Error enviando push de audio a admins:', e));

            return res.json({ success: true, ruta: rutaAudio });
        } catch (error) {
            console.error("Error en portalClienteController.enviarAudioChat:", error);
            return res.status(500).json({ success: false, error: 'Error al procesar el mensaje de audio' });
        }
    },

    // Enviar una imagen de chat
    enviarImagenChat: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No se recibió ninguna imagen válida' });
            }

            // La ruta web para acceder al archivo subido
            const rutaImagen = '/uploads/soporte/' + req.file.filename;

            await SoporteMensajeModel.enviarMensaje({
                cliente_id: clienteId,
                remitente: 'cliente',
                mensaje: rutaImagen,
                tipo: 'imagen'
            });

            // Notificar a los administradores
            const { sendPushToAdmins } = require('../utils/pushService');
            sendPushToAdmins({
                title: `📷 Imagen de ${req.session.cliente.nombre || 'Cliente'}`,
                body: 'Envió una imagen en el chat',
                icon: '/img/icon-192.png',
                url: '/soporte'
            }).catch(e => console.error('Error enviando push de imagen a admins:', e));

            return res.json({ success: true, ruta: rutaImagen });
        } catch (error) {
            console.error("Error en portalClienteController.enviarImagenChat:", error);
            return res.status(500).json({ success: false, error: 'Error al procesar el mensaje de imagen' });
        }
    },

    // 5. Obtener estado actual (polling)
    estadoActual: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            
            // Marcar mensajes del administrador como entregados silenciosamente en cada polling de estado del dashboard
            try {
                await SoporteMensajeModel.marcarComoEntregado(clienteId, 'administrador');
            } catch (e) {
                console.error("Error al auto-marcar entregados en estadoActual:", e.message);
            }
            
            // Usamos res.locals que ya fue cargado por app.js
            const chatSinLeer = res.locals.clienteChatSinLeer || 0;

            // Obtener reportes
            const reportes = await ReportePagoModel.obtenerPorCliente(clienteId);
            const reportesStatus = reportes.map(r => ({
                id: r.id,
                estado: r.estado,
                observaciones: r.observaciones
            }));

            res.json({
                success: true,
                chatSinLeer,
                reportes: reportesStatus
            });
        } catch (error) {
            console.error("Error en estadoActual:", error);
            res.status(500).json({ success: false });
        }
    },

    // 6. Reportar aporte de ahorro subiendo comprobante
    reportarAporte: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const { cuenta_id, monto, observaciones } = req.body;

            let comprobanteUrl = null;
            if (req.file) {
                comprobanteUrl = `/uploads/${req.file.filename}`;
            }

            if (!cuenta_id || !monto) {
                req.flash('mensajeError', 'La cuenta y el monto son requeridos.');
                return res.redirect('/portal-cliente');
            }

            // Limpiar formato de moneda estilo Colombia (quitar puntos de miles)
            const cleanMonto = parseFloat(monto.toString().replace(/\./g, '').replace(/,/g, '.').trim());

            if (isNaN(cleanMonto) || cleanMonto <= 0) {
                req.flash('mensajeError', 'Monto inválido.');
                return res.redirect('/portal-cliente');
            }

            // comprobanteUrl ya está asignado arriba

            await AhorroReporteModel.crear({
                cuenta_id: parseInt(cuenta_id),
                cliente_id: clienteId,
                monto: cleanMonto,
                comprobante_url: comprobanteUrl,
                observaciones: observaciones || null
            });

            // Notificar a los administradores
            const { sendPushToAdmins } = require('../utils/pushService');
            sendPushToAdmins({
                title: `💰 Nuevo Aporte de Ahorro`,
                body: `${req.session.cliente.nombre || 'Un cliente'} ha subido un comprobante de ahorro por $${cleanMonto.toLocaleString('es-CO')}.`,
                icon: '/img/icon-192.png',
                url: '/ahorros/solicitudes'
            }).catch(e => console.error('Error enviando push de aporte de ahorro:', e));

            req.flash('mensajeExito', 'Comprobante de ahorro reportado con éxito. Está en espera de verificación.');
            res.redirect('/portal-cliente');
        } catch (error) {
            console.error("Error en portalClienteController.reportarAporte:", error);
            req.flash('mensajeError', 'Ocurrió un error al procesar tu comprobante.');
            res.redirect('/portal-cliente');
        }
    },

    // 7. Solicitar retiro de ahorro
    solicitarRetiro: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const { cuenta_id, monto_solicitado, comentarios } = req.body;

            if (!cuenta_id || !monto_solicitado) {
                req.flash('mensajeError', 'El monto es requerido.');
                return res.redirect('/portal-cliente');
            }

            // Limpiar formato de moneda estilo Colombia (quitar puntos)
            const cleanMonto = parseFloat(monto_solicitado.toString().replace(/\./g, '').replace(/,/g, '.').trim());

            if (isNaN(cleanMonto) || cleanMonto <= 0) {
                req.flash('mensajeError', 'Monto solicitado inválido.');
                return res.redirect('/portal-cliente');
            }

            const cuenta = await AhorroModel.obtenerPorId(cuenta_id);

            if (!cuenta || cuenta.cliente_id !== clienteId) {
                req.flash('mensajeError', 'Cuenta de ahorros no encontrada.');
                return res.redirect('/portal-cliente');
            }

            const saldoDisponible = parseFloat(cuenta.saldo_actual || 0);

            if (cleanMonto > saldoDisponible) {
                req.flash('mensajeError', `El monto solicitado excede tu saldo disponible ($ ${saldoDisponible.toLocaleString('es-CO')}).`);
                return res.redirect('/portal-cliente');
            }

            await AhorroSolicitudModel.crear({
                cuenta_id: parseInt(cuenta_id),
                cliente_id: clienteId,
                monto_solicitado: cleanMonto,
                comentarios: comentarios || null
            });

            // Notificar a los administradores
            const { sendPushToAdmins } = require('../utils/pushService');
            sendPushToAdmins({
                title: `💸 Solicitud de Retiro de Ahorro`,
                body: `${req.session.cliente.nombre || 'Un cliente'} ha solicitado retirar $${cleanMonto.toLocaleString('es-CO')} de sus ahorros.`,
                icon: '/img/icon-192.png',
                url: '/ahorros/solicitudes'
            }).catch(e => console.error('Error enviando push de solicitud de retiro:', e));

            req.flash('mensajeExito', 'Tu solicitud de retiro de ahorro ha sido enviada con éxito. Un asesor la revisará pronto.');
            res.redirect('/portal-cliente');
        } catch (error) {
            console.error("Error en portalClienteController.solicitarRetiro:", error);
            req.flash('mensajeError', 'Error al procesar tu solicitud de retiro.');
            res.redirect('/portal-cliente');
        }
    },

    // Ver el contrato para firmarlo
    verContrato: async (req, res) => {
        try {
            const { id } = req.params;
            const prestamo = await PrestamoModel.obtenerPorId(id);

            if (!prestamo || prestamo.cliente_id !== req.session.cliente.id) {
                req.flash('mensajeError', 'Préstamo no encontrado o no tienes permiso.');
                return res.redirect('/portal-cliente');
            }

            if (prestamo.firma_digital) {
                req.flash('mensajeExito', 'Este contrato ya fue firmado.');
                return res.redirect('/portal-cliente');
            }

            const cliente = await ClienteModel.obtenerPorId(req.session.cliente.id);
            res.render('portal-cliente/contrato', {
                title: 'Firma de Contrato',
                cliente,
                prestamo,
                layout: false
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar el contrato.');
            res.redirect('/portal-cliente');
        }
    },

    // Recibir y guardar la firma
    firmarContrato: async (req, res) => {
        try {
            const { id } = req.params;
            const { firma } = req.body;
            const prestamo = await PrestamoModel.obtenerPorId(id);

            if (!prestamo || prestamo.cliente_id !== req.session.cliente.id) {
                return res.status(403).json({ success: false, message: 'No tienes permiso.' });
            }

            if (prestamo.firma_digital) {
                return res.status(400).json({ success: false, message: 'Ya firmado.' });
            }

            // Obtener IP de manera más robusta detrás de Nginx/Deploy
            let ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
            // Si viene una lista (ej. proxy1, proxy2), tomamos la primera
            if (ip && ip.includes(',')) {
                ip = ip.split(',')[0].trim();
            }

            await PrestamoModel.guardarFirma(id, firma, ip);

            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno.' });
        }
    }
};

module.exports = portalClienteController;
