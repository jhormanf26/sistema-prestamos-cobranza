const express = require('express');
const router = express.Router();
const comprobantesController = require('../controllers/comprobantesController');
const protegerRuta = require('../middleware/auth');

// Proteger todas las rutas
router.use(protegerRuta);

// Listar comprobantes de pago pendientes de validación
router.get('/', comprobantesController.listar);

// Procesar comprobante (aprobar o rechazar)
router.post('/:id/procesar', comprobantesController.procesar);

module.exports = router;
