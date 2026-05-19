const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const protegerRuta = require('../middleware/auth');

// Proteger todas las rutas de solicitudes para administradores
router.use(protegerRuta);

// Listar solicitudes de crédito pendientes
router.get('/', solicitudesController.listar);

// Procesar solicitud (aprobar con modificaciones o rechazar)
router.post('/:id/procesar', solicitudesController.procesar);

module.exports = router;
