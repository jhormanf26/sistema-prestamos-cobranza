const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');
const mercadopagoController = require('../controllers/mercadopagoController');

// GET: Mostrar formulario para un préstamo específico
router.get('/registrar/:id_prestamo', pagosController.mostrarFormulario);

// POST: Guardar el pago
router.post('/guardar', pagosController.guardar);

// --- RUTAS MERCADOPAGO ---
// Generar link de pago (Requiere sesión de cliente, aunque la verificación la hace el controlador)
router.post('/checkout', mercadopagoController.crearPreferencia);

// Webhook para notificaciones de MercadoPago (Público, sin sesión)
router.post('/webhook', mercadopagoController.webhook);

module.exports = router;