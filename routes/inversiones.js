const express = require('express');
const router = express.Router();
const InversionesController = require('../controllers/inversionesController');
const uploadCsv = require('../middleware/uploadCsv');

// Middleware de verificación de autenticación de usuario
function autenticado(req, res, next) {
    if (req.session && req.session.usuario) {
        return next();
    }
    req.flash('mensajeError', 'Debes iniciar sesión para acceder a esta sección.');
    res.redirect('/auth/login');
}

router.use(autenticado);

// Vista Principal (KPIs, Gráficos, Movimientos)
router.get('/', InversionesController.renderizarIndex);

// Carga de archivo CSV
router.post('/subir-csv', uploadCsv.single('archivo_csv'), InversionesController.subirCsv);

// Creación manual de cuenta
router.post('/cuenta', InversionesController.crearCuentaManual);

// Edición de cuenta de inversión
router.post('/cuenta/editar/:id', InversionesController.actualizarCuenta);

// Registro manual de movimiento
router.post('/movimiento', InversionesController.crearMovimientoManual);

// Eliminar movimiento
router.post('/movimiento/eliminar/:id', InversionesController.eliminarMovimiento);

// Eliminar cuenta de inversión
router.post('/eliminar/:id', InversionesController.eliminarInversion);

// Endpoint AJAX para proyecciones
router.get('/proyeccion-ajax', InversionesController.obtenerProyeccionAjax);

module.exports = router;
