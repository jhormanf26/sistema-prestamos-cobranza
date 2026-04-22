const PagoModel = require('../models/PagoModel');
const PrestamoModel = require('../models/PrestamoModel');
const ConfigModel = require('../models/ConfigModel');
const emailService = require('../utils/emailService');
const BitacoraModel = require('../models/BitacoraModel'); // TU AUDITORÍA
const CajaModel = require('../models/CajaModel'); // <--- AGREGADO: NECESARIO PARA VIDEO 2
const { formatCurrency } = require('../utils/formatters');

const pagosController = {

    // 1. Mostrar formulario (TU CÓDIGO ORIGINAL)
    mostrarFormulario: async (req, res) => {
        const { id_prestamo } = req.params;
        try {
            const [prestamo, config] = await Promise.all([
                PrestamoModel.obtenerPorId(id_prestamo),
                ConfigModel.obtener()
            ]);
            
            if (!prestamo) {
                req.flash('mensajeError', 'El préstamo no existe');
                return res.redirect('/prestamos');
            }

            const totalPagado = parseFloat(await PagoModel.obtenerTotalPagado(id_prestamo));
            const totalDeuda = parseFloat(prestamo.monto_total);
            const saldoPendiente = totalDeuda - totalPagado;

            const historial = await PagoModel.obtenerHistorial(id_prestamo);
            const empresaConfig = config || { moneda: '$' };

            res.render('pagos/registrar', {
                title: 'Registrar Pago',
                prestamo: prestamo,
                saldoPendiente: saldoPendiente,
                historial: historial,
                empresa: empresaConfig
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar el préstamo');
            res.redirect('/prestamos');
        }
    },

    // 2. Guardar el pago (TU CÓDIGO + CORRECCIÓN DE CAJA)
    guardar: async (req, res) => {
        const { prestamo_id, monto_pagado, observaciones } = req.body;
        
        // Obtenemos el usuario de la sesión (o Admin si no existe)
        const usuarioActual = (req.session && req.session.usuario) ? req.session.usuario : { id: 1, nombre: 'Administrador' };

        try {
            if (!monto_pagado || monto_pagado <= 0) {
                req.flash('mensajeError', 'El monto debe ser mayor a 0');
                return res.redirect(`/pagos/registrar/${prestamo_id}`);
            }

            const prestamo = await PrestamoModel.obtenerPorId(prestamo_id);
            const totalPagado = parseFloat(await PagoModel.obtenerTotalPagado(prestamo_id));
            const saldoPendiente = parseFloat(prestamo.monto_total) - totalPagado;

            if (parseFloat(monto_pagado) > saldoPendiente) {
                req.flash('mensajeError', `El monto excede la deuda. Solo debe: ${formatCurrency(saldoPendiente, 2)}`);
                return res.redirect(`/pagos/registrar/${prestamo_id}`);
            }

            // A. Guardar Pago (TU CÓDIGO)
            await PagoModel.crear({
                prestamo_id,
                monto_pagado,
                observaciones
            });

            // --- INICIO CORRECCIÓN VIDEO 2 ---
            // Registrar el ingreso en la CAJA para que salga en el reporte
            await CajaModel.registrar({
                tipo: 'ingreso', // Fundamental para que sume
                monto: parseFloat(monto_pagado),
                descripcion: `Cobro Préstamo #${prestamo_id} - ${prestamo.nombre} ${prestamo.apellido}`,
                usuario_id: usuarioActual.id,
                referencia_id: prestamo_id,
                categoria: 'Cobro Préstamo'
            });
            // --- FIN CORRECCIÓN ---

            // B. Verificar si liquidó (TU CÓDIGO)
            const nuevoTotalPagado = totalPagado + parseFloat(monto_pagado);
            if (nuevoTotalPagado >= (parseFloat(prestamo.monto_total) - 0.01)) {
                await PrestamoModel.actualizarEstado(prestamo_id, 'pagado');
            }

            // C. REGISTRAR EN BITÁCORA (TU CÓDIGO)
            await BitacoraModel.registrar(
                usuarioActual.nombre, 
                'REGISTRAR_PAGO', 
                `Pago recibido de ${monto_pagado} para el préstamo #${prestamo_id}`
            );

            // D. Enviar Correo (TU CÓDIGO)
            if (prestamo.email) {
                let config = await ConfigModel.obtener();
                const simboloMoneda = config ? config.moneda : '$';
                const nuevoSaldo = saldoPendiente - parseFloat(monto_pagado);
                
                const { asunto: asuntoBD, html: contenidoHTML } = await emailService.plantillaPago(
                    `${prestamo.nombre} ${prestamo.apellido}`,
                    monto_pagado,
                    new Date(),
                    nuevoSaldo,
                    simboloMoneda
                );

                const asunto = asuntoBD || 'Recibo de Pago Confirmado';
                emailService.enviarCorreo(prestamo.email, asunto, contenidoHTML);
            }

            req.flash('mensajeExito', 'Pago registrado correctamente');
            res.redirect('/prestamos');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al registrar el pago');
            res.redirect('/prestamos');
        }
    }
};

module.exports = pagosController;