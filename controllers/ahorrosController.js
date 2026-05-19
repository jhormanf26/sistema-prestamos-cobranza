const AhorroModel = require('../models/AhorroModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel'); // <--- Importamos Configuración
const emailService = require('../utils/emailService');
const AhorroReporteModel = require('../models/AhorroReporteModel');
const AhorroSolicitudModel = require('../models/AhorroSolicitudModel');

const ahorrosController = {

    // 1. Listar Cuentas
    listar: async (req, res) => {
        try {
            const cuentas = await AhorroModel.obtenerTodas();
            res.render('ahorros/index', { 
                title: 'Cuentas de Ahorro',
                cuentas: cuentas
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar cuentas');
            res.redirect('/');
        }
    },

    // 2. Aperturar cuenta
    aperturar: async (req, res) => {
        try {
            const todosClientes = await ClienteModel.obtenerTodos();
            res.render('ahorros/aperturar', {
                title: 'Nueva Cuenta de Ahorros',
                clientes: todosClientes
            });
        } catch (error) {
            console.error(error);
            res.redirect('/ahorros');
        }
    },

    // 3. Guardar nueva cuenta
    guardarCuenta: async (req, res) => {
        const { cliente_id, meta_monto, meta_nombre } = req.body;
        try {
            const existe = await AhorroModel.buscarPorCliente(cliente_id);
            if (existe) {
                req.flash('mensajeError', 'Este cliente ya tiene una cuenta activa');
                return res.redirect('/ahorros/aperturar');
            }

            const metaMontoFinal = meta_monto ? parseFloat(meta_monto.replace(/\./g, '')) : null;

            await AhorroModel.crear(cliente_id, metaMontoFinal, meta_nombre);
            req.flash('mensajeExito', 'Cuenta aperturada correctamente');
            res.redirect('/ahorros');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear cuenta');
            res.redirect('/ahorros');
        }
    },

    // 4. Ver Movimientos
    verCuenta: async (req, res) => {
        const { id } = req.params;
        try {
            const cuenta = await AhorroModel.obtenerPorId(id);
            if (!cuenta) return res.redirect('/ahorros');

            const movimientos = await AhorroModel.obtenerMovimientos(id);

            res.render('ahorros/ver', {
                title: 'Detalle de Cuenta',
                cuenta,
                movimientos
            });
        } catch (error) {
            console.error(error);
            res.redirect('/ahorros');
        }
    },

    // 5. Procesar Transacción (Con Moneda Sincronizada)
    procesarTransaccion: async (req, res) => {
        const { cuenta_id, tipo, monto, observacion } = req.body;
        
        try {
            const montoFloat = parseFloat(monto);
            if (montoFloat <= 0) {
                req.flash('mensajeError', 'El monto debe ser mayor a 0');
                return res.redirect(`/ahorros/ver/${cuenta_id}`);
            }

            const cuenta = await AhorroModel.obtenerPorId(cuenta_id);

            if (tipo === 'retiro' && montoFloat > parseFloat(cuenta.saldo_actual)) {
                req.flash('mensajeError', 'Saldo insuficiente para realizar el retiro');
                return res.redirect(`/ahorros/ver/${cuenta_id}`);
            }

            await AhorroModel.registrarMovimiento(cuenta_id, tipo, montoFloat, observacion);

            let nuevoSaldo = parseFloat(cuenta.saldo_actual);
            if(tipo === 'deposito') nuevoSaldo += montoFloat;
            else nuevoSaldo -= montoFloat;

            // --- ENVÍO DE CORREO ---
            if (cuenta.email) {
                // Obtenemos moneda
                let config = await ConfigModel.obtener();
                const simboloMoneda = config ? config.moneda : '$';

                const { asunto: asuntoBD, html: contenidoHTML } = await emailService.plantillaAhorro(
                    `${cuenta.nombre} ${cuenta.apellido}`,
                    tipo,
                    montoFloat,
                    nuevoSaldo,
                    simboloMoneda // <--- Pasamos moneda
                );

                const asunto = asuntoBD || `Notificación de ${tipo.toUpperCase()}`;
                emailService.enviarCorreo(cuenta.email, asunto, contenidoHTML);
            }

            req.flash('mensajeExito', 'Transacción realizada con éxito');
            res.redirect(`/ahorros/ver/${cuenta_id}`);

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error en la transacción');
            res.redirect(`/ahorros/ver/${cuenta_id}`);
        }
    },

    // 6. Actualizar Meta de Ahorro
    actualizarMeta: async (req, res) => {
        const { id } = req.params;
        const { meta_nombre, meta_monto } = req.body;
        
        try {
            // Limpiar puntos de miles y formatear a decimal/float
            const metaMontoFinal = meta_monto ? parseFloat(meta_monto.replace(/\./g, '')) : null;
            
            await AhorroModel.actualizarMeta(id, metaMontoFinal, meta_nombre || null);
            
            req.flash('mensajeExito', 'Meta de ahorro actualizada correctamente');
            res.redirect('/ahorros');
        } catch (error) {
            console.error("Error al actualizar la meta de ahorro:", error);
            req.flash('mensajeError', 'Error al actualizar la meta de ahorro');
            res.redirect('/ahorros');
        }
    },

    // 7. Bandeja de Solicitudes (Aportes y Retiros)
    solicitudes: async (req, res) => {
        try {
            const reportesPendientes = await AhorroReporteModel.obtenerPendientes();
            const retirosPendientes = await AhorroSolicitudModel.obtenerPendientes();

            res.render('ahorros/solicitudes', {
                title: 'Solicitudes de Ahorros',
                reportes: reportesPendientes,
                retiros: retirosPendientes
            });
        } catch (error) {
            console.error("Error al cargar solicitudes de ahorro:", error);
            req.flash('mensajeError', 'Error al cargar las solicitudes');
            res.redirect('/ahorros');
        }
    },

    // 8. Tramitar Aporte (Aprobar o Rechazar)
    tramitarAporte: async (req, res) => {
        const { reporte_id, accion, observaciones } = req.body;
        const validadorId = req.session.usuario ? req.session.usuario.id : null;

        try {
            const reporte = await AhorroReporteModel.obtenerPorId(reporte_id);
            if (!reporte) {
                req.flash('mensajeError', 'Reporte no encontrado');
                return res.redirect('/ahorros/solicitudes');
            }

            if (reporte.estado !== 'pendiente') {
                req.flash('mensajeError', 'Este reporte ya fue tramitado');
                return res.redirect('/ahorros/solicitudes');
            }

            const estado = accion === 'aprobar' ? 'aprobado' : 'rechazado';
            
            await AhorroReporteModel.actualizarEstado(reporte_id, estado, observaciones, validadorId);

            if (estado === 'aprobado') {
                await AhorroModel.registrarMovimiento(
                    reporte.cuenta_id, 
                    'deposito', 
                    parseFloat(reporte.monto), 
                    observaciones || 'Aporte validado desde el portal cliente'
                );
            }

            // Aquí se podría enviar una push notification de respuesta al cliente si el cliente tiene suscripción.
            const { sendPushToUser } = require('../utils/pushService');
            sendPushToUser(reporte.cliente_id, {
                title: estado === 'aprobado' ? '✅ Aporte Aprobado' : '❌ Aporte Rechazado',
                body: estado === 'aprobado' ? `Tu aporte de $${parseFloat(reporte.monto).toLocaleString('es-CO')} ha sido aprobado.` : `Tu aporte fue rechazado: ${observaciones}`,
                url: '/portal-cliente'
            }).catch(e => console.error('Push error:', e));

            req.flash('mensajeExito', `Reporte ${estado} con éxito.`);
            res.redirect('/ahorros/solicitudes');
        } catch (error) {
            console.error("Error al tramitar aporte:", error);
            req.flash('mensajeError', 'Ocurrió un error al tramitar el aporte');
            res.redirect('/ahorros/solicitudes');
        }
    },

    // 9. Tramitar Retiro (Aprobar o Rechazar)
    tramitarRetiro: async (req, res) => {
        const { solicitud_id, accion, comentarios_admin } = req.body;
        const resolutorId = req.session.usuario ? req.session.usuario.id : null;

        try {
            const solicitud = await AhorroSolicitudModel.obtenerPorId(solicitud_id);
            if (!solicitud) {
                req.flash('mensajeError', 'Solicitud no encontrada');
                return res.redirect('/ahorros/solicitudes');
            }

            if (solicitud.estado !== 'pendiente') {
                req.flash('mensajeError', 'Esta solicitud ya fue tramitada');
                return res.redirect('/ahorros/solicitudes');
            }

            const estado = accion === 'aprobar' ? 'aprobado' : 'rechazado';

            const cuenta = await AhorroModel.obtenerPorId(solicitud.cuenta_id);
            if (estado === 'aprobado' && parseFloat(solicitud.monto_solicitado) > parseFloat(cuenta.saldo_actual)) {
                req.flash('mensajeError', 'No se puede aprobar. El cliente no tiene saldo suficiente.');
                return res.redirect('/ahorros/solicitudes');
            }

            await AhorroSolicitudModel.actualizarEstado(solicitud_id, estado, comentarios_admin, resolutorId);

            if (estado === 'aprobado') {
                await AhorroModel.registrarMovimiento(
                    solicitud.cuenta_id, 
                    'retiro', 
                    parseFloat(solicitud.monto_solicitado), 
                    comentarios_admin || 'Retiro aprobado y tramitado.'
                );
            }

            const { sendPushToUser } = require('../utils/pushService');
            sendPushToUser(solicitud.cliente_id, {
                title: estado === 'aprobado' ? '✅ Retiro Aprobado' : '❌ Retiro Rechazado',
                body: estado === 'aprobado' ? `Tu retiro de $${parseFloat(solicitud.monto_solicitado).toLocaleString('es-CO')} ha sido aprobado y tramitado.` : `Tu retiro fue rechazado: ${comentarios_admin}`,
                url: '/portal-cliente'
            }).catch(e => console.error('Push error:', e));

            req.flash('mensajeExito', `Solicitud de retiro ${estado} con éxito.`);
            res.redirect('/ahorros/solicitudes');
        } catch (error) {
            console.error("Error al tramitar retiro:", error);
            req.flash('mensajeError', 'Ocurrió un error al tramitar la solicitud de retiro');
            res.redirect('/ahorros/solicitudes');
        }
    }
};

module.exports = ahorrosController;