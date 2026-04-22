const ClienteModel = require('../models/ClienteModel');
const PrestamoModel = require('../models/PrestamoModel'); // Asegúrate de tener este modelo si usas verPerfil
const EmpenoModel = require('../models/EmpenoModel');    // Asegúrate de tener este modelo
const AhorroModel = require('../models/AhorroModel');    // Asegúrate de tener este modelo
const ConfigModel = require('../models/ConfigModel');    // Asegúrate de tener este modelo

const clientesController = {

    // 1. Listar (MANTIENE PAGINACIÓN Y BÚSQUEDA)
    listar: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            const busqueda = req.query.q || '';

            let clientes;
            let totalRegistros;

            if (busqueda) {
                clientes = await ClienteModel.buscarPaginados(busqueda, limit, offset);
                totalRegistros = await ClienteModel.contarBusqueda(busqueda);
            } else {
                clientes = await ClienteModel.obtenerPaginados(limit, offset);
                totalRegistros = await ClienteModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);

            res.render('clientes/index', { 
                title: 'Gestión de Clientes',
                clientes: clientes,
                busqueda: busqueda,
                currentPage: page,
                totalPages: totalPages,
                totalRegistros: totalRegistros
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al obtener los clientes');
            res.redirect('/');
        }
    },

    // 2. Formulario Crear (MANTIENE FUNCIONALIDAD)
    mostrarFormulario: (req, res) => {
        res.render('clientes/crear', { 
            title: 'Nuevo Cliente'
        });
    },

    // 3. Guardar Cliente (MANTIENE FOTO)
    guardar: async (req, res) => {
        const { dni, nombre, apellido, telefono, direccion, email } = req.body;
        const foto = req.file ? req.file.filename : null;

        if (!dni || !nombre || !apellido) {
            req.flash('mensajeError', 'CC, Nombre y Apellido son obligatorios');
            return res.redirect('/clientes/crear');
        }

        try {
            const existe = await ClienteModel.buscarPorDNI(dni);
            if (existe) {
                req.flash('mensajeError', 'El cliente con ese CC ya existe');
                return res.redirect('/clientes/crear');
            }

            await ClienteModel.crear({ dni, nombre, apellido, telefono, direccion, email, foto });
            req.flash('mensajeExito', 'Cliente registrado correctamente');
            res.redirect('/clientes');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al guardar el cliente');
            res.redirect('/clientes/crear');
        }
    },

    // 4. Ver Perfil (MANTIENE PERFIL COMPLETO)
    verPerfil: async (req, res) => {
        const { id } = req.params;
        try {
            // Usamos Promise.all para cargar todo rápido
            // Nota: Si no tienes alguno de estos modelos importados arriba, coméntalo para que no falle
            const [cliente, prestamos, empenos, cuentaAhorro, config] = await Promise.all([
                ClienteModel.obtenerPorId(id),
                PrestamoModel ? PrestamoModel.obtenerPorCliente(id) : [],
                EmpenoModel ? EmpenoModel.obtenerPorCliente(id) : [],
                AhorroModel ? AhorroModel.buscarPorCliente(id) : null,
                ConfigModel ? ConfigModel.obtener() : {}
            ]);

            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado');
                return res.redirect('/clientes');
            }

            const empresaConfig = config || { moneda: '$' };

            res.render('clientes/perfil', {
                title: `Perfil de ${cliente.nombre}`,
                cliente,
                prestamos: prestamos || [],
                empenos: empenos || [],
                cuentaAhorro,
                empresa: empresaConfig
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar perfil');
            res.redirect('/clientes');
        }
    },

    // 5. Mostrar Edición
    mostrarEdicion: async (req, res) => {
        const { id } = req.params;
        try {
            const cliente = await ClienteModel.obtenerPorId(id);
            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado');
                return res.redirect('/clientes');
            }
            res.render('clientes/editar', {
                title: 'Editar Cliente',
                cliente
            });
        } catch (error) {
            console.error(error);
            res.redirect('/clientes');
        }
    },

    // 6. Procesar Edición (MANTIENE FOTO)
    actualizar: async (req, res) => {
        const { id } = req.params;
        const { dni, nombre, apellido, telefono, direccion, email } = req.body;
        const foto = req.file ? req.file.filename : null;

        try {
            await ClienteModel.actualizar(id, { dni, nombre, apellido, telefono, direccion, email, foto });
            req.flash('mensajeExito', 'Datos del cliente actualizados');
            res.redirect('/clientes');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar');
            res.redirect(`/clientes/editar/${id}`);
        }
    },

    // 7. (NUEVO) CAMBIAR ESTADO
    // Esta es la función nueva para Activar/Desactivar
    cambiarEstado: async (req, res) => {
        const { id } = req.params;
        try {
            const cliente = await ClienteModel.obtenerPorId(id);
            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado.');
                return res.redirect('/clientes');
            }

            // Si estado es null o undefined, asumimos que es 1 (Activo)
            const estadoActual = (cliente.estado === undefined || cliente.estado === null) ? 1 : cliente.estado;
            const nuevoEstado = (estadoActual == 1) ? 0 : 1;

            await ClienteModel.cambiarEstado(id, nuevoEstado);

            const accion = (nuevoEstado == 1) ? 'Habilitado' : 'Inhabilitado';
            req.flash('mensajeExito', `El cliente ${cliente.nombre} ha sido ${accion}.`);
            res.redirect('/clientes');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cambiar estado.');
            res.redirect('/clientes');
        }
    }
};

module.exports = clientesController;
