const fs = require('fs');
const InversionModel = require('../models/InversionModel');
const { parsearCSVInversiones } = require('../utils/inversionParser');

class InversionesController {
    /**
     * Renderiza el tablero principal de Inversiones con KPIs, gráficos y lista de movimientos.
     */
    static async renderizarIndex(req, res) {
        try {
            const inversionId = req.query.inversion_id ? parseInt(req.query.inversion_id) : null;
            const pagina = req.query.pagina ? parseInt(req.query.pagina) : 1;
            const busqueda = req.query.busqueda || '';

            const cuentas = await InversionModel.obtenerTodasLasCuentas();
            const kpis = await InversionModel.obtenerResumenKPIs(inversionId);
            const serieMensual = await InversionModel.obtenerSerieMensual(inversionId);
            const datosMovimientos = await InversionModel.obtenerMovimientosPaginados(inversionId, pagina, 20, busqueda);
            const proyeccion = await InversionModel.calcularProyeccion(inversionId, 6);

            res.render('inversiones/index', {
                title: 'Gestión de Inversiones & Analítica',
                cuentas,
                inversionSeleccionada: inversionId,
                kpis,
                serieMensual,
                movimientos: datosMovimientos.movimientos,
                paginacion: datosMovimientos.paginacion,
                busqueda,
                proyeccion
            });
        } catch (error) {
            console.error('Error al cargar módulo de inversiones:', error);
            req.flash('mensajeError', 'Error al cargar la sección de inversiones: ' + error.message);
            res.redirect('/');
        }
    }

    /**
     * Procesa la subida del archivo CSV e importa los movimientos evitando duplicados.
     */
    static async subirCsv(req, res) {
        try {
            if (!req.file) {
                if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                    return res.status(400).json({ exito: false, mensaje: 'Por favor selecciona un archivo CSV.' });
                }
                req.flash('mensajeError', 'Por favor selecciona un archivo CSV válido.');
                return res.redirect('/inversiones');
            }

            const contenido = fs.readFileSync(req.file.path, 'utf-8');
            const datosParsed = parsearCSVInversiones(contenido);
            const resultado = await InversionModel.procesarImportacionCSV(datosParsed);

            // Eliminar el archivo temporal
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('Aviso: No se pudo eliminar el archivo temporal CSV:', e.message);
            }

            const msg = `CSV procesado exitosamente para la cuenta [${resultado.cuenta.tipo_cuenta} - ${resultado.cuenta.numero_cuenta}]. Registros creados: ${resultado.insertados}, Ignorados (Duplicados): ${resultado.ignorados}.`;

            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.json({
                    exito: true,
                    mensaje: msg,
                    resultado
                });
            }

            req.flash('mensajeExito', msg);
            res.redirect('/inversiones');
        } catch (error) {
            console.error('Error al procesar CSV de inversiones:', error);
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try { fs.unlinkSync(req.file.path); } catch (e) {}
            }

            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(500).json({ exito: false, mensaje: 'Error procesando CSV: ' + error.message });
            }

            req.flash('mensajeError', 'Error al procesar el archivo CSV: ' + error.message);
            res.redirect('/inversiones');
        }
    }

    /**
     * Crea manualmente una nueva cuenta de inversión.
     */
    static async crearCuentaManual(req, res) {
        try {
            const { tipo_cuenta, numero_cuenta, saldo_inicial, descripcion } = req.body;

            if (!tipo_cuenta || !numero_cuenta) {
                req.flash('mensajeError', 'Por favor ingresa el tipo y número de la nueva cuenta.');
                return res.redirect('/inversiones');
            }

            const cuenta = await InversionModel.crearCuentaManual({
                tipo_cuenta,
                numero_cuenta,
                saldo_inicial: parseFloat(saldo_inicial || 0),
                descripcion: descripcion || null
            });

            req.flash('mensajeExito', `Nueva cuenta [${cuenta.tipo_cuenta} - ${cuenta.numero_cuenta}] creada exitosamente.`);
            res.redirect(`/inversiones?inversion_id=${cuenta.id}`);
        } catch (error) {
            console.error('Error al crear nueva cuenta de inversión:', error);
            req.flash('mensajeError', 'Error al crear la cuenta de inversión: ' + error.message);
            res.redirect('/inversiones');
        }
    }

    /**
     * Crea un movimiento de inversión manualmente.
     */
    static async crearMovimientoManual(req, res) {
        try {
            const { inversion_id, fecha, descripcion, tipo_movimiento, valor } = req.body;

            if (!inversion_id || !fecha || !descripcion || !tipo_movimiento || valor === undefined) {
                req.flash('mensajeError', 'Por favor completa todos los campos requeridos del movimiento.');
                return res.redirect('/inversiones');
            }

            await InversionModel.crearMovimientoManual({
                inversion_id: parseInt(inversion_id),
                fecha,
                descripcion,
                tipo_movimiento,
                valor: parseFloat(valor)
            });

            req.flash('mensajeExito', 'Movimiento registrado correctamente.');
            res.redirect('/inversiones');
        } catch (error) {
            console.error('Error al registrar movimiento manual:', error);
            req.flash('mensajeError', 'Error al registrar el movimiento: ' + error.message);
            res.redirect('/inversiones');
        }
    }

    /**
     * Elimina un movimiento individual.
     */
    static async eliminarMovimiento(req, res) {
        try {
            const { id } = req.params;
            await InversionModel.eliminarMovimiento(parseInt(id));
            req.flash('mensajeExito', 'Movimiento eliminado correctamente.');
            res.redirect('/inversiones');
        } catch (error) {
            console.error('Error al eliminar movimiento:', error);
            req.flash('mensajeError', 'Error al eliminar el movimiento.');
            res.redirect('/inversiones');
        }
    }

    /**
     * Elimina una cuenta de inversión completa.
     */
    static async eliminarInversion(req, res) {
        try {
            const { id } = req.params;
            await InversionModel.eliminarInversion(parseInt(id));
            req.flash('mensajeExito', 'Inversión y sus movimientos fueron eliminados correctamente.');
            res.redirect('/inversiones');
        } catch (error) {
            console.error('Error al eliminar inversión:', error);
            req.flash('mensajeError', 'Error al eliminar la inversión.');
            res.redirect('/inversiones');
        }
    }

    /**
     * Endpoint AJAX para recalcular la proyección a N meses a futuro.
     */
    static async obtenerProyeccionAjax(req, res) {
        try {
            const inversionId = req.query.inversion_id ? parseInt(req.query.inversion_id) : null;
            const meses = req.query.meses ? parseInt(req.query.meses) : 6;

            const proyeccion = await InversionModel.calcularProyeccion(inversionId, meses);
            res.json({ exito: true, proyeccion });
        } catch (error) {
            console.error('Error al obtener proyección AJAX:', error);
            res.status(500).json({ exito: false, mensaje: 'Error calculando proyección.' });
        }
    }

    /**
     * Actualiza la información de una cuenta de inversión.
     */
    static async actualizarCuenta(req, res) {
        try {
            const { id } = req.params;
            const { tipo_cuenta, numero_cuenta, saldo_inicial, descripcion } = req.body;

            if (!tipo_cuenta || !numero_cuenta) {
                req.flash('mensajeError', 'Por favor ingresa el nombre/tipo y número de la cuenta.');
                return res.redirect('/inversiones');
            }

            await InversionModel.actualizarCuenta(parseInt(id), {
                tipo_cuenta,
                numero_cuenta,
                saldo_inicial: parseFloat(saldo_inicial || 0),
                descripcion
            });

            req.flash('mensajeExito', 'Cuenta de inversión actualizada exitosamente.');
            res.redirect(`/inversiones?inversion_id=${id}`);
        } catch (error) {
            console.error('Error al actualizar cuenta de inversión:', error);
            req.flash('mensajeError', 'Error al actualizar la cuenta de inversión: ' + error.message);
            res.redirect('/inversiones');
        }
    }
}

module.exports = InversionesController;
