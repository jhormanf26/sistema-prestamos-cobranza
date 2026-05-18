const express = require('express');
const router = express.Router();
const portalClienteController = require('../controllers/portalClienteController');
const authCliente = require('../middleware/authCliente');

// Rutas Públicas (Login)
router.get('/login', portalClienteController.mostrarLogin);
router.post('/login', portalClienteController.login);
router.get('/logout', portalClienteController.logout);

// Rutas Protegidas
router.use(authCliente);

router.get('/', portalClienteController.dashboard);
router.get('/perfil', portalClienteController.perfil);
router.post('/perfil/password', portalClienteController.actualizarPassword);
router.post('/registrar-instalacion', portalClienteController.registrarInstalacion);

module.exports = router;
