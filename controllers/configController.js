const ConfigModel = require('../models/ConfigModel');

const configController = {

    // Mostrar formulario de configuración
    mostrar: async (req, res) => {
        try {
            const config = await ConfigModel.obtener();
            res.render('config/index', {
                title: 'Configuración de Empresa',
                config: config
            });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    // Guardar cambios
    actualizar: async (req, res) => {
        try {
            const { nombre_empresa, ruc, direccion, telefono, email_contacto, moneda, nequi_numero, breve_numero } = req.body;

            // Si hay archivo, usamos su nombre, si no, null
            const logo = req.file ? req.file.filename : null;

            const modulos_activos = {
                clientes: req.body.mod_clientes === 'on',
                prestamos: req.body.mod_prestamos === 'on',
                simulador: req.body.mod_simulador === 'on',
                gastos: req.body.mod_gastos === 'on',
                reportes: req.body.mod_reportes === 'on',
                empenos: req.body.mod_empenos === 'on',
                ahorros: req.body.mod_ahorros === 'on',
                cadenas: req.body.mod_cadenas === 'on',
                promocion: req.body.mod_promocion === 'on',
                comprobantes: req.body.mod_comprobantes === 'on',
                solicitudes: req.body.mod_solicitudes === 'on',
                soporte: req.body.mod_soporte === 'on'
            };

            await ConfigModel.actualizar({
                nombre_empresa, ruc, direccion, telefono, email_contacto, moneda, logo,
                modulos_activos: JSON.stringify(modulos_activos),
                nequi_numero: nequi_numero || '--',
                breve_numero: breve_numero || '--'
            });

            req.flash('mensajeExito', 'Configuración actualizada correctamente');
            res.redirect('/config');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar configuración');
            res.redirect('/config');
        }
    }
};

module.exports = configController;