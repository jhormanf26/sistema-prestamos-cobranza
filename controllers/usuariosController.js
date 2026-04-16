const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcryptjs');

const usuariosController = {

    // Listar usuarios - SE MANTIENE
    listar: async (req, res) => {
        try {
            const usuarios = await UsuarioModel.obtenerTodos();
            res.render('usuarios/index', { 
                title: 'Gestión de Personal',
                usuarios: usuarios,
                usuario: req.session.usuario // Importante para validar permisos en la vista
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar usuarios');
            res.redirect('/');
        }
    },

    // Formulario de creación - SE MANTIENE
    mostrarFormulario: (req, res) => {
        res.render('usuarios/crear', { 
            title: 'Nuevo Usuario',
            usuario: req.session.usuario 
        });
    },

    // Guardar nuevo usuario - SE MANTIENE
    guardar: async (req, res) => {
        const { nombre_completo, email, password, rol } = req.body;

        try {
            const existe = await UsuarioModel.buscarPorEmail(email);
            if (existe) {
                req.flash('mensajeError', 'El correo electrónico ya está registrado.');
                return res.redirect('/usuarios/crear');
            }

            const passwordHash = await bcrypt.hash(password, 10);

            await UsuarioModel.crear({
                nombre_completo,
                email,
                password: passwordHash,
                rol
            });

            req.flash('mensajeExito', 'Usuario creado correctamente.');
            res.redirect('/usuarios');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear usuario.');
            res.redirect('/usuarios/crear');
        }
    },

    // (MODIFICADO) CAMBIAR ESTADO (Activar/Desactivar)
    // Reemplaza la lógica de eliminación directa
    cambiarEstado: async (req, res) => {
        const { id } = req.params;
        const miId = req.session.usuario.id;

        // 1. Evitar bloquearse a uno mismo
        if (parseInt(id) === parseInt(miId)) {
            req.flash('mensajeError', 'Acción denegada: No puedes desactivar tu propia cuenta.');
            return res.redirect('/usuarios');
        }

        try {
            // 2. Obtener el usuario actual para ver su estado
            const usuarioObjetivo = await UsuarioModel.buscarPorId(id);
            
            if (!usuarioObjetivo) {
                req.flash('mensajeError', 'Usuario no encontrado.');
                return res.redirect('/usuarios');
            }

            // 3. Invertir estado (Si es 1 pasa a 0, si es 0 pasa a 1)
            // Asumiendo que 1 = Activo, 0 = Inactivo en tu BD
            const estadoActual = usuarioObjetivo.estado;
            const nuevoEstado = (estadoActual == 1) ? 0 : 1;

            await UsuarioModel.cambiarEstado(id, nuevoEstado);

            // 4. Mensaje informativo claro
            const accion = (nuevoEstado == 1) ? 'Habilitado/Activado' : 'Bloqueado/Desactivado';
            req.flash('mensajeExito', `El usuario "${usuarioObjetivo.nombre_completo}" ha sido ${accion} correctamente.`);
            res.redirect('/usuarios');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cambiar el estado del usuario.');
            res.redirect('/usuarios');
        }
    }
};

module.exports = usuariosController;