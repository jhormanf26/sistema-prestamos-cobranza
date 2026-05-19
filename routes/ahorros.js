const express = require('express');
const router = express.Router();
const ahorrosController = require('../controllers/ahorrosController');

// Listar todas las cuentas
router.get('/', ahorrosController.listar);

// Apertura
router.get('/aperturar', ahorrosController.aperturar);
router.post('/guardar', ahorrosController.guardarCuenta);

// Ver y Operar (Transacciones)
router.get('/ver/:id', ahorrosController.verCuenta);
router.post('/transaccion', ahorrosController.procesarTransaccion);

// Actualizar Meta de Ahorro
router.post('/meta/:id', ahorrosController.actualizarMeta);

// Bandeja de solicitudes de Aportes y Retiros
router.get('/solicitudes', ahorrosController.solicitudes);
router.post('/tramitar-aporte', ahorrosController.tramitarAporte);
router.post('/tramitar-retiro', ahorrosController.tramitarRetiro);

module.exports = router;