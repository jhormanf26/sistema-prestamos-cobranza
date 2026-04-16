const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamosController');

// Listar
router.get('/', prestamosController.listar);

// Reportes especiales
router.get('/vencidos', prestamosController.verVencidos);
router.get('/cronograma/:id', prestamosController.verCronograma); // <--- NUEVA RUTA

// Crear
router.get('/crear', prestamosController.mostrarFormulario);
router.post('/guardar', prestamosController.guardar);

module.exports = router;