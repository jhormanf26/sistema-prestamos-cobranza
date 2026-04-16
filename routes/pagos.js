const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');

// GET: Mostrar formulario para un préstamo específico
router.get('/registrar/:id_prestamo', pagosController.mostrarFormulario);

// POST: Guardar el pago
router.post('/guardar', pagosController.guardar);

module.exports = router;