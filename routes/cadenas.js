const express = require('express');
const router = express.Router();
const cadenasController = require('../controllers/cadenasController');

// Listar y Crear
router.get('/', cadenasController.listar);
router.get('/crear', cadenasController.crear);
router.post('/guardar', cadenasController.guardar);

// Detalle y Gestión
router.get('/ver/:id', cadenasController.ver);
router.post('/participantes/agregar/:id', cadenasController.agregarParticipante);
router.post('/pagos/registrar', cadenasController.registrarPago);
router.post('/entregar', cadenasController.entregar);
router.post('/avanzar/:id', cadenasController.avanzarCiclo);
router.get('/recordatorio/:id', cadenasController.enviarRecordatorio);

module.exports = router;
