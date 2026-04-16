const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const protegerRuta = require('../middleware/auth');

router.use(protegerRuta);

router.get('/', cajaController.index);         // Ver caja o formulario de apertura
router.post('/abrir', cajaController.abrir);   // Guardar apertura
router.post('/cerrar', cajaController.cerrar); // Guardar cierre

module.exports = router;