const express = require('express');
const router = express.Router();
const plantillasPdfController = require('../controllers/plantillasPdfController');

router.get('/', plantillasPdfController.listar);
router.get('/editar/:slug', plantillasPdfController.editar);
router.post('/actualizar/:id', plantillasPdfController.actualizar);

module.exports = router;
