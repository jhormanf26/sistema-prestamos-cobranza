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
const groqService = require('../services/groqService');
const OtpService = require('../utils/otpService');

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
            const solicitudesCredito = await SolicitudCreditoModel.obtenerPorCliente(clienteId);
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
                solicitudesCredito,
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

    // 2. Solicitar préstamo usando cupo pre-aprobado u ordinario
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
            const tieneCupo = cupoDisponible > 0;
            const limiteMaximoOrdinario = 3000000; // Límite general $3.000.000

            if (tieneCupo) {
                if (cleanMonto > cupoDisponible) {
                    req.flash('mensajeError', `El monto solicitado excede tu cupo pre-aprobado disponible ($ ${cupoDisponible.toLocaleString('es-CO')}).`);
                    return res.redirect('/portal-cliente');
                }
            } else {
                if (cleanMonto > limiteMaximoOrdinario) {
                    req.flash('mensajeError', `El monto solicitado excede el límite máximo permitido para solicitudes ordinarias ($ ${limiteMaximoOrdinario.toLocaleString('es-CO')}).`);
                    return res.redirect('/portal-cliente');
                }
            }

            await SolicitudCreditoModel.crear({
                cliente_id: clienteId,
                monto_solicitado: cleanMonto,
                cuotas: parseInt(cuotas),
                frecuencia: frecuencia || 'quincenal'
            });

            // Notificar a los administradores
            const { sendPushToAdmins } = require('../utils/pushService');
            const tituloPush = tieneCupo ? `🚀 Nueva Solicitud de Desembolso (Cupo)` : `📝 Nueva Solicitud de Crédito Ordinario`;
            const detallePush = tieneCupo 
                ? `${req.session.cliente.nombre || 'Un cliente'} ha solicitado un cupo rápido por $${cleanMonto.toLocaleString('es-CO')}.`
                : `${req.session.cliente.nombre || 'Un cliente'} ha enviado una solicitud de crédito ordinario por $${cleanMonto.toLocaleString('es-CO')}.`;

            sendPushToAdmins({
                title: tituloPush,
                body: detallePush,
                icon: '/img/icon-192.png',
                url: '/solicitudes'
            }).catch(e => console.error('Error enviando push de solicitud:', e));

            const mensajeExito = tieneCupo
                ? 'Tu solicitud de desembolso rápido por cupo pre-aprobado ha sido enviada con éxito. Un asesor la revisará pronto.'
                : 'Tu solicitud de crédito ordinario ha sido enviada con éxito. Nuestro equipo de riesgos la evaluará pronto.';

            req.flash('mensajeExito', mensajeExito);
            res.redirect('/portal-cliente');
        } catch (error) {
            console.error("Error en portalClienteController.solicitarCupo:", error);
            req.flash('mensajeError', 'Error al procesar tu solicitud de crédito.');
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
            const { cuenta_id, monto_solicitado, comentarios, otp } = req.body;

            if (!cuenta_id || !monto_solicitado || !otp) {
                req.flash('mensajeError', 'La cuenta, el monto y el código OTP son requeridos.');
                return res.redirect('/portal-cliente');
            }

            // Validar OTP primero
            const validacionOtp = await OtpService.verificar(clienteId, 'retiro_ahorro', parseInt(cuenta_id), otp);
            if (!validacionOtp.success) {
                req.flash('mensajeError', validacionOtp.message);
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

            req.flash('mensajeExito', 'Tu solicitud de retiro de ahorro ha sido verificada y enviada con éxito. Un asesor la revisará pronto.');
            res.redirect('/portal-cliente');
        } catch (error) {
            console.error("Error en portalClienteController.solicitarRetiro:", error);
            req.flash('mensajeError', 'Error al procesar tu solicitud de retiro.');
            res.redirect('/portal-cliente');
        }
    },

    // Solicitar OTP para retiro de ahorros
    solicitarOtpRetiro: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const { cuenta_id, monto_solicitado } = req.body;

            if (!cuenta_id || !monto_solicitado) {
                return res.status(400).json({ success: false, message: 'La cuenta y el monto son requeridos.' });
            }

            // Limpiar formato de moneda estilo Colombia (quitar puntos)
            const cleanMonto = parseFloat(monto_solicitado.toString().replace(/\./g, '').replace(/,/g, '.').trim());

            if (isNaN(cleanMonto) || cleanMonto <= 0) {
                return res.status(400).json({ success: false, message: 'Monto solicitado inválido.' });
            }

            const cuenta = await AhorroModel.obtenerPorId(cuenta_id);
            if (!cuenta || cuenta.cliente_id !== clienteId) {
                return res.status(403).json({ success: false, message: 'Cuenta de ahorros no encontrada o no pertenece al cliente.' });
            }

            const saldoDisponible = parseFloat(cuenta.saldo_actual || 0);
            if (cleanMonto > saldoDisponible) {
                return res.status(400).json({ success: false, message: `El monto solicitado excede tu saldo disponible ($ ${saldoDisponible.toLocaleString('es-CO')}).` });
            }

            const cliente = await ClienteModel.obtenerPorId(clienteId);
            if (!cliente || !cliente.email) {
                return res.status(400).json({ success: false, message: 'No tienes un correo electrónico configurado para verificación.' });
            }

            await OtpService.generarYEnviar(clienteId, cliente.email, 'retiro_ahorro', parseInt(cuenta_id));

            return res.json({ success: true, message: `Código de verificación enviado al correo ${cliente.email}.` });
        } catch (error) {
            console.error('Error en solicitarOtpRetiro:', error);
            return res.status(500).json({ success: false, message: 'Ocurrió un error al enviar el código de verificación.' });
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
            const { firma, otp } = req.body;
            const prestamo = await PrestamoModel.obtenerPorId(id);

            if (!prestamo || prestamo.cliente_id !== req.session.cliente.id) {
                return res.status(403).json({ success: false, message: 'No tienes permiso.' });
            }

            if (prestamo.firma_digital) {
                return res.status(400).json({ success: false, message: 'Ya firmado.' });
            }

            if (!otp) {
                return res.status(400).json({ success: false, message: 'El código de seguridad OTP es requerido.' });
            }

            // Validar OTP
            const validacionOtp = await OtpService.verificar(req.session.cliente.id, 'firma_contrato', parseInt(id), otp);
            if (!validacionOtp.success) {
                return res.status(400).json({ success: false, message: validacionOtp.message });
            }

            // Obtener IP de manera más robusta detrás de Nginx/Deploy
            let ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
            // Si viene una lista (ej. proxy1, proxy2), tomamos la primera
            if (ip && ip.includes(',')) {
                ip = ip.split(',')[0].trim();
            }

            await PrestamoModel.guardarFirma(id, firma, ip, otp);

            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno.' });
        }
    },

    // Solicitar OTP para la firma de contrato digital
    solicitarOtpFirma: async (req, res) => {
        try {
            const { id } = req.params; // ID del préstamo
            const clienteId = req.session.cliente.id;
            
            const prestamo = await PrestamoModel.obtenerPorId(id);
            if (!prestamo || prestamo.cliente_id !== clienteId) {
                return res.status(403).json({ success: false, message: 'Préstamo no encontrado o sin permisos.' });
            }

            if (prestamo.firma_digital) {
                return res.status(400).json({ success: false, message: 'El contrato ya se encuentra firmado.' });
            }

            const cliente = await ClienteModel.obtenerPorId(clienteId);
            if (!cliente || !cliente.email) {
                return res.status(400).json({ success: false, message: 'El cliente no tiene un correo electrónico configurado para verificación.' });
            }

            await OtpService.generarYEnviar(clienteId, cliente.email, 'firma_contrato', parseInt(id));

            return res.json({ success: true, message: `Código de verificación enviado al correo ${cliente.email}.` });
        } catch (error) {
            console.error('Error en solicitarOtpFirma:', error);
            return res.status(500).json({ success: false, message: 'Ocurrió un error al enviar el código de verificación.' });
        }
    },

    // Interactuar con el asistente de IA usando Groq
    chatAsistenteIA: async (req, res) => {
        try {
            const clienteId = req.session.cliente.id;
            const { mensajes } = req.body;

            if (!mensajes || !Array.isArray(mensajes)) {
                return res.status(400).json({ success: false, message: 'El historial de mensajes es requerido y debe ser un arreglo.' });
            }

            // Consultar datos del cliente
            const cliente = await ClienteModel.obtenerPorId(clienteId);
            const prestamos = await PrestamoModel.obtenerPorCliente(clienteId);
            const cuentaAhorro = await AhorroModel.buscarPorCliente(clienteId);
            const empenos = await EmpenoModel.obtenerPorCliente(clienteId);
            const empresa = await ConfigModel.obtener();

            // Filtrar y calcular datos detallados de préstamos activos
            const prestamosActivos = prestamos.filter(p => p.estado !== 'pagado');
            let infoPrestamos = '';

            if (prestamosActivos.length > 0) {
                for (let p of prestamosActivos) {
                    const pagos = await PagoModel.obtenerHistorial(p.id);
                    const totalPagado = pagos.reduce((acc, pago) => acc + parseFloat(pago.monto_pagado), 0);
                    const proxima = finance.obtenerProximaCuota(p.monto_total, p.cuotas, p.frecuencia, p.fecha_inicio, totalPagado);

                    let detalleProxima = 'No hay cuotas próximas programadas o el préstamo ya está liquidado.';
                    if (proxima) {
                        const formateadaFecha = new Date(proxima.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        });
                        detalleProxima = `Cuota #${proxima.numero} por un valor de $${parseFloat(proxima.monto).toLocaleString('es-CO')} con fecha de vencimiento el ${formateadaFecha}. Saldo restante de esta cuota: $${parseFloat(proxima.restante).toLocaleString('es-CO')}.`;
                    }

                    infoPrestamos += `
- Préstamo ID: #${p.id}
  * Monto Desembolsado: $${parseFloat(p.monto_prestado).toLocaleString('es-CO')}
  * Monto Total a Pagar (con intereses): $${parseFloat(p.monto_total).toLocaleString('es-CO')}
  * Total Pagado a la fecha: $${totalPagado.toLocaleString('es-CO')}
  * Saldo Pendiente Total: $${(parseFloat(p.monto_total) - totalPagado).toLocaleString('es-CO')}
  * Plazo Total: ${p.cuotas} cuotas
  * Frecuencia de Pago: ${p.frecuencia}
  * Estado: ${p.estado}
  * Firma Digital Contrato: ${p.firma_digital ? 'Firmado' : 'PENDIENTE POR FIRMAR'}
  * Próxima Cuota: ${detalleProxima}
  * Observaciones: ${p.observaciones || 'Ninguna'}
`;
                }
            } else {
                infoPrestamos = 'No tiene préstamos activos actualmente.';
            }

            // Datos de la cuenta de ahorros
            let infoAhorros = 'No posee cuenta de ahorros en el sistema.';
            if (cuentaAhorro) {
                const movimientos = await AhorroModel.obtenerMovimientos(cuentaAhorro.id);
                const ultimosMovimientos = movimientos.slice(0, 4).map(m => {
                    const fechaMov = new Date(m.fecha_movimiento).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
                    const tipoMov = m.tipo_movimiento === 'deposito' ? 'Depósito' : 'Retiro';
                    return `- ${fechaMov}: ${tipoMov} de $${parseFloat(m.monto).toLocaleString('es-CO')} (Observación: ${m.observacion || 'Ninguna'})`;
                }).join('\n');

                infoAhorros = `
- Cuenta de Ahorro ID: ${cuentaAhorro.id}
  * Saldo Disponible: $${parseFloat(cuentaAhorro.saldo_actual || 0).toLocaleString('es-CO')}
  * Meta de Ahorro: ${cuentaAhorro.meta_nombre || 'No establecida'} (Monto Objetivo: $${parseFloat(cuentaAhorro.meta_monto || 0).toLocaleString('es-CO')})
  * Últimos Movimientos:
${ultimosMovimientos || 'Sin movimientos registrados.'}
`;
            }

            // Datos de empeños si los hay
            let infoEmpenos = 'No posee empeños activos.';
            if (empenos && empenos.length > 0) {
                infoEmpenos = empenos.map(e => `- Artículo: ${e.articulo}, Monto Prestado: $${parseFloat(e.monto_prestado).toLocaleString('es-CO')}, Estado: ${e.estado === 1 ? 'Activo' : 'Liquidado/Vencido'}`).join('\n');
            }

            // Construir el System Prompt de contexto seguro
            const promptSistema = `Eres el Asistente de Inteligencia Artificial del sistema de créditos de la empresa "${empresa.nombre || 'Nuestra Organización'}".
Tu rol es resolver dudas del cliente de manera amable, clara y profesional en español.
Te comunicas con el cliente: ${cliente.nombre} ${cliente.apellido} (DNI: ${cliente.dni}, Teléfono: ${cliente.telefono || 'No registrado'}).

A continuación, se te presenta la información financiera oficial, actualizada y en tiempo real del cliente. Utiliza EXCLUSIVAMENTE estos datos para responder preguntas sobre sus préstamos, cuotas, fechas de pago o ahorros:

=== INFORMACIÓN DEL CLIENTE ===
Nombre Completo: ${cliente.nombre} ${cliente.apellido}
DNI: ${cliente.dni}
Monto Máximo Pre-aprobado para Nuevos Créditos: $${parseFloat(cliente.monto_preaprobado || 0).toLocaleString('es-CO')}

=== PRÉSTAMOS ACTIVOS ===
${infoPrestamos}

=== CUENTAS DE AHORRO ===
${infoAhorros}

=== EMPEÑOS ===
${infoEmpenos}

=== CANALES DE PAGO DISPONIBLES ===
Si el cliente desea realizar un abono o pagar su cuota, indícale que los canales disponibles y oficiales configurados en el sistema son:
- Nequi (Celular): ${empresa.nequi_numero || 'No disponible'}
- Bre-B / Transfiya (Celular): ${empresa.breve_numero || 'No disponible'}
Indícale que puede reportar su pago desde el botón "Reportar Pago" de su panel subiendo el comprobante.

=== REGLAS IMPORTANTES DE COMPORTAMIENTO ===
1. Responde de forma concisa y directa. Evita rodeos innecesarios.
2. Utiliza siempre el formato de moneda estilo Colombia (ej. $ 100.000) con puntos como separadores de miles y sin decimales si son valores enteros.
3. Bajo ninguna circunstancia inventes datos sobre cuotas, fechas o saldos que no estén listados en el contexto anterior. Si el cliente te pregunta algo que no está en este prompt, responde amablemente indicándole que no tienes esa información en el sistema y que debe comunicarse directamente con la administración de la empresa o con soporte técnico a través de la sección de chat de soporte.
4. Eres un asistente de consulta. No puedes realizar transacciones, aprobar créditos ni modificar saldos directamente. Solo brindas información.
5. Si el cliente tiene préstamos con "Firma Digital Contrato: PENDIENTE POR FIRMAR", adviértele de forma clara y amable que debe ingresar al dashboard de su cuenta y pulsar sobre el botón "Firmar Ahora" en el banner azul para poder completar el proceso de contratación.
6. Si el cliente tiene dudas muy complejas que requieran intervención administrativa (por ejemplo, reportar un pago ya rechazado, quejas sobre el servicio, fallas en la aplicación, o si solicita hablar con un humano/asesor), recomiéndale e invítale de forma amable a conversar con un asesor en tiempo real a través del enlace de Markdown [Chat de Soporte Técnico](/portal-cliente/chat).
7. No menciones que estás recibiendo un "System Prompt" o "Contexto". Habla de forma natural como si consultaras directamente la base de datos de la plataforma.
`;

            // Limitar el historial de conversación a los últimos 6 mensajes para optimizar la velocidad y el consumo de tokens
            const historialOptimizado = mensajes.slice(-6);

            // Agregar el prompt de sistema al inicio del historial de mensajes
            const mensajesPayload = [
                { role: 'system', content: promptSistema },
                ...historialOptimizado
            ];

            // Llamar al servicio de Groq
            const respuestaIA = await groqService.enviarMensajeChat(mensajesPayload);

            res.json({ success: true, response: respuestaIA });

        } catch (error) {
            console.error('Error en el chatbot del asistente de IA:', error);
            res.status(500).json({ 
                success: false, 
                message: 'El asistente de IA no está disponible en este momento. Inténtelo más tarde o contacte con soporte técnico.' 
            });
        }
    }
};

module.exports = portalClienteController;
