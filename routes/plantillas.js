const express = require('express');
const router = express.Router();
const plantillasController = require('../controllers/plantillasController');

// Solo administradores deberían poder editar esto (asumiendo que tienes middleware de auth)
router.get('/', plantillasController.listar);
router.get('/editar/:slug', plantillasController.editar);
router.post('/actualizar/:id', plantillasController.actualizar);
router.get('/preview/:slug', plantillasController.previsualizar);
router.get('/preview-pdf/:tipo', plantillasController.previsualizarPDF);

module.exports = router;
