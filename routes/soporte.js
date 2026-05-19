const express = require('express');
const router = express.Router();
const soporteController = require('../controllers/soporteController');
const protegerRuta = require('../middleware/auth');

// Aplicar protección de administrador a todas las rutas de soporte
router.use(protegerRuta);

// Listar chats activos
router.get('/', soporteController.listarChats);

const uploadAudio = require('../middleware/uploadAudio');
const uploadImage = require('../middleware/uploadImage');

// Obtener mensajes de un cliente específico
router.get('/chat/:clienteId', soporteController.verChatCliente);

// Enviar respuesta al chat de un cliente
router.post('/chat/:clienteId/responder', soporteController.enviarMensaje);
router.post('/chat/:clienteId/responder-audio', uploadAudio.single('audio'), soporteController.enviarAudioChat);
router.post('/chat/:clienteId/responder-imagen', uploadImage.single('imagen'), soporteController.enviarImagenChat);

module.exports = router;
