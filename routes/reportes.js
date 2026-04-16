const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const protegerRuta = require('../middleware/auth');

router.use(protegerRuta);

// Panel Principal
router.get('/panel', reportesController.mostrarPanel);

// Excel Avanzado
router.post('/excel/generar', reportesController.descargarReporteExcel);

// Excel Simple (Prestamos)
router.get('/excel/prestamos', reportesController.exportarExcelPrestamos);

// PDF: Contrato
router.get('/contrato/:id', reportesController.generarContrato);

// PDF: Cronograma
router.get('/cronograma/:id', reportesController.generarCronogramaPDF);

// PDF: Ticket de Pago (Cuota)
router.get('/ticket/:id', reportesController.generarTicket);

// PDF: Ticket de Desembolso (Entrega de Dinero) - ¡NUEVO!
router.get('/ticket-desembolso/:id', reportesController.generarTicketDesembolso);

// PDF: Estado de Cuenta
router.get('/estado-cuenta/:id', reportesController.generarEstadoCuenta);

// PDF: Ticket Ahorro
router.get('/ticket-ahorro/:id', reportesController.generarTicketAhorro);

module.exports = router;