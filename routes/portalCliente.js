const express = require('express');
const router = express.Router();
const portalClienteController = require('../controllers/portalClienteController');
const clienteDocumentosController = require('../controllers/clienteDocumentosController');
const authCliente = require('../middleware/authCliente');
const upload = require('../middleware/upload');
const uploadDocumento = require('../middleware/uploadDocumento');

// Rutas Públicas (Login)
router.get('/login', portalClienteController.mostrarLogin);
router.post('/login', portalClienteController.login);
router.get('/logout', portalClienteController.logout);

// Rutas Protegidas
router.use(authCliente);
const cargarDatosPredictivosCliente = require('../middleware/cargarDatosPredictivosCliente');
router.use(cargarDatosPredictivosCliente);

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

// Ruta Asistente de IA (Chatbot)
router.post('/ai-assistant/chat', portalClienteController.chatAsistenteIA);

// Rutas Contrato Digital
router.get('/contrato/:id', portalClienteController.verContrato);
router.post('/firmar-contrato/:id', portalClienteController.firmarContrato);

// Rutas de Gestión de Documentos del Cliente
router.get('/documentos', clienteDocumentosController.mostrarDocumentos);
router.post('/documentos/subir', uploadDocumento.single('documento'), clienteDocumentosController.subirDocumento);

module.exports = router;
