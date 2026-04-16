const EmpenoModel = require('../models/EmpenoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const CajaModel = require('../models/CajaModel'); // Importante: Usa la función registrar del archivo anterior

// Carga segura de la Bitácora
let BitacoraModel;
try {
    BitacoraModel = require('../models/BitacoraModel');
} catch (error) {
    BitacoraModel = null;
}

const empenosController = {

    // 1. Listar
    listar: async (req, res) => {
        try {
            const empenos = await EmpenoModel.obtenerTodos();
            const config = await ConfigModel.obtener();
            const empresaConfig = config || { moneda: 'S/' };

            res.render('empenos/index', { 
                title: 'Gestión de Empeños',
                empenos: empenos,
                empresa: empresaConfig,
                usuario: req.session.usuario
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar listado');
            res.redirect('/');
        }
    },

    // 2. Formulario
    mostrarFormulario: async (req, res) => {
        try {
            const clientes = await ClienteModel.obtenerTodos();
            
            if (!clientes || clientes.length === 0) {
                req.flash('mensajeError', 'Primero debe registrar al menos un Cliente.');
                return res.redirect('/clientes');
            }

            res.render('empenos/crear', { 
                title: 'Nuevo Empeño',
                clientes: clientes,
                usuario: req.session.usuario
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar formulario');
            res.redirect('/empenos');
        }
    },

    // 3. Guardar (Integra Fotos + Caja + Bitácora)
    guardar: async (req, res) => {
        try {
            const { cliente_id, nombre_articulo, descripcion, valor_tasacion, monto_prestado, fecha_limite } = req.body;
            
            // Foto
            const imagenNombre = req.file ? req.file.filename : null;
            // Usuario
            const usuarioActual = (req.session && req.session.usuario) ? req.session.usuario : { id: 1, nombre: 'Sistema' };

            if (!cliente_id || !nombre_articulo || !monto_prestado) {
                req.flash('mensajeError', 'Faltan datos obligatorios.');
                return res.redirect('/empenos/crear');
            }

            const datosEmpeno = {
                cliente_id: parseInt(cliente_id),
                nombre_articulo: nombre_articulo.trim(),
                descripcion: descripcion ? descripcion.trim() : '',
                valor_tasacion: parseFloat(valor_tasacion) || 0,
                monto_prestado: parseFloat(monto_prestado) || 0,
                fecha_limite: fecha_limite || null,
                estado: 'en_custodia',
                imagen: imagenNombre,
                created_at: new Date()
            };

            // A. Guardar Empeño
            await EmpenoModel.crear(datosEmpeno);

            // B. Descontar de Caja (EGRESO)
            // Aquí es donde ocurría el error si CajaModel estaba incompleto
            await CajaModel.registrar(
                `Desembolso Empeño: ${datosEmpeno.nombre_articulo}`, 
                datosEmpeno.monto_prestado, 
                'egreso',
                usuarioActual.id,
            );

            // C. Bitácora
            if (BitacoraModel) {
                try {
                    await BitacoraModel.registrar(usuarioActual.nombre, 'NUEVO_EMPENO', `Item: ${datosEmpeno.nombre_articulo}`);
                } catch (e) {}
            }

            req.flash('mensajeExito', 'Empeño registrado y dinero descontado.');
            res.redirect('/empenos');

        } catch (error) {
            console.error("Error al guardar:", error);
            req.flash('mensajeError', 'Error al guardar el empeño.');
            res.redirect('/empenos/crear');
        }
    },

    // 4. Devolver
    devolver: async (req, res) => {
        const { id } = req.params;
        const usuarioActual = (req.session && req.session.usuario) ? req.session.usuario : { id: 1, nombre: 'Sistema' };

        try {
            const empeno = await EmpenoModel.obtenerPorId(id);
            if (!empeno) {
                req.flash('mensajeError', 'El empeño no existe.');
                return res.redirect('/empenos');
            }

            if (empeno.estado !== 'en_custodia') {
                req.flash('mensajeError', 'Este artículo ya fue devuelto.');
                return res.redirect('/empenos');
            }

            // A. Actualizar estado
            await EmpenoModel.actualizarEstado(id, 'devuelto', empeno.monto_prestado, new Date());

            // B. Ingresar dinero a Caja (INGRESO)
            await CajaModel.registrar(
                `Recuperación Empeño: ${empeno.nombre_articulo}`, 
                empeno.monto_prestado, 
                'ingreso',
                usuarioActual.id,
                empeno.id
            );

            // C. Bitácora
            if (BitacoraModel) {
                try {
                    await BitacoraModel.registrar(usuarioActual.nombre, 'DEVOLUCION', `ID: ${id}`);
                } catch (e) {}
            }

            req.flash('mensajeExito', 'Artículo devuelto y dinero ingresado.');
            res.redirect('/empenos');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al procesar devolución');
            res.redirect('/empenos');
        }
    }
};

module.exports = empenosController;
