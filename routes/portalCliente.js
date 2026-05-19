const express = require('express');
const router = express.Router();
const portalClienteController = require('../controllers/portalClienteController');
const authCliente = require('../middleware/authCliente');
const upload = require('../middleware/upload');

// Rutas Públicas (Login)
router.get('/login', portalClienteController.mostrarLogin);
router.post('/login', portalClienteController.login);
router.get('/logout', portalClienteController.logout);

// Rutas Protegidas
router.use(authCliente);

router.get('/', portalClienteController.dashboard);
router.get('/perfil', portalClienteController.perfil);
router.post('/perfil/password', portalClienteController.actualizarPassword);
router.post('/registrar-instalacion', portalClienteController.registrarInstalacion);

const uploadAudio = require('../middleware/uploadAudio');
const uploadImage = require('../middleware/uploadImage');

// Nuevas funcionalidades del Portal del Cliente
router.post('/reportar-pago', upload.single('comprobante'), portalClienteController.reportarPago);
router.post('/solicitar-cupo', portalClienteController.solicitarCupo);
router.post('/reportar-aporte', upload.single('comprobante'), portalClienteController.reportarAporte);
router.post('/solicitar-retiro', portalClienteController.solicitarRetiro);
router.get('/chat', portalClienteController.verChat);
router.post('/chat/enviar', portalClienteController.enviarMensajeChat);
router.post('/chat/enviar-audio', uploadAudio.single('audio'), portalClienteController.enviarAudioChat);
router.post('/chat/enviar-imagen', uploadImage.single('imagen'), portalClienteController.enviarImagenChat);

// Endpoint para polling de estado en tiempo real (Chat y Reportes)
router.get('/estado-actual', portalClienteController.estadoActual);

module.exports = router;
