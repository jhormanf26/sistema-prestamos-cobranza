const CajaModel = require('../models/CajaModel');

const cajaController = {
    
    // Pantalla Principal (Inteligente: Detecta si abrir o mostrar resumen)
    index: async (req, res) => {
        try {
            const sesion = await CajaModel.obtenerSesionAbierta();

            // ESCENARIO 1: CAJA CERRADA -> Mostrar formulario de apertura
            if (!sesion) {
                return res.render('caja/aperturar', {
                    title: 'Apertura de Caja',
                    usuario: req.session.usuario
                });
            }

            // ESCENARIO 2: CAJA ABIERTA -> Calcular totales
            const movimientos = await CajaModel.obtenerMovimientosDesde(sesion.fecha_apertura);

            let totalIngresos = 0;
            let totalEgresos = 0;

            movimientos.forEach(m => {
                if (m.tipo === 'ingreso') totalIngresos += parseFloat(m.monto);
                else totalEgresos += parseFloat(m.monto);
            });

            const saldoActual = parseFloat(sesion.monto_inicial) + totalIngresos - totalEgresos;

            res.render('caja/index', {
                title: 'Corte de Caja',
                sesion: sesion,
                movimientos: movimientos,
                resumen: {
                    inicial: parseFloat(sesion.monto_inicial),
                    ingresos: totalIngresos,
                    egresos: totalEgresos,
                    saldo: saldoActual
                },
                usuario: req.session.usuario
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar la caja');
            res.redirect('/');
        }
    },

    // Procesar Apertura
    abrir: async (req, res) => {
        try {
            const { monto_inicial } = req.body;
            const usuario = req.session.usuario ? req.session.usuario.nombre : 'Sistema';

            await CajaModel.abrirCaja(monto_inicial || 0, usuario);
            
            req.flash('mensajeExito', '¡Caja aperturada correctamente!');
            res.redirect('/caja');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'No se pudo abrir la caja');
            res.redirect('/caja');
        }
    },

    // Procesar Cierre
    cerrar: async (req, res) => {
        try {
            const { id_sesion, monto_final } = req.body;
            
            await CajaModel.cerrarCaja(id_sesion, monto_final);
            
            req.flash('mensajeExito', 'Corte de caja realizado y turno cerrado.');
            res.redirect('/caja'); // Al redirigir, como está cerrada, pedirá abrir de nuevo
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cerrar caja');
            res.redirect('/caja');
        }
    }
};

module.exports = cajaController;