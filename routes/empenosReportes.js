const express = require('express');
const router = express.Router();
const empenosReportesController = require('../controllers/empenosReportesController');
const protegerRuta = require('../middleware/auth');

router.use(protegerRuta);

// Rutas exclusivas para reportes de Empeños
router.get('/contrato/:id', empenosReportesController.generarContrato);
router.get('/ticket/:id', empenosReportesController.generarTicket);

module.exports = router;