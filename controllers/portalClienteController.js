const ClienteModel = require('../models/ClienteModel');
const PrestamoModel = require('../models/PrestamoModel');
const AhorroModel = require('../models/AhorroModel');
const EmpenoModel = require('../models/EmpenoModel');
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
            const cliente = await ClienteModel.obtenerPorId(clienteId);
            const prestamos = await PrestamoModel.obtenerPorCliente(clienteId);
            const cuentaAhorro = await AhorroModel.buscarPorCliente(clienteId);
            const empenos = await EmpenoModel.obtenerPorCliente(clienteId);
            
            // Separar préstamos por estado para facilidad
            const prestamosActivos = prestamos.filter(p => p.estado !== 'pagado');
            const prestamosPagados = prestamos.filter(p => p.estado === 'pagado');

            res.render('portal-cliente/dashboard', {
                title: 'Mi Portal',
                cliente,
                prestamosActivos,
                prestamosPagados,
                prestamos, // Enviamos todos para compatibilidad si la vista lo requiere
                cuentaAhorro,
                empenos,
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
    }
};

module.exports = portalClienteController;
