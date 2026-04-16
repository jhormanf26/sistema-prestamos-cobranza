const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Middleware simple para verificar si es Admin (SE MANTIENE)
const esAdmin = (req, res, next) => {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        return next();
    }
    req.flash('mensajeError', 'Acceso denegado: Solo administradores.');
    return res.redirect('/');
};

// Rutas protegidas
router.get('/', esAdmin, usuariosController.listar);
router.get('/crear', esAdmin, usuariosController.mostrarFormulario);
router.post('/guardar', esAdmin, usuariosController.guardar);

// --- CAMBIO AQUÍ: Ruta para Activar/Desactivar ---
// Antes era: router.get('/eliminar/:id', ...)
router.get('/cambiar-estado/:id', esAdmin, usuariosController.cambiarEstado);

module.exports = router;