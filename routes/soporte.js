const express = require('express');
const router = express.Router();
const soporteController = require('../controllers/soporteController');
const protegerRuta = require('../middleware/auth');

// Aplicar protección de administrador a todas las rutas de soporte
router.use(protegerRuta);

// Listar chats activos
router.get('/', soporteController.listarChats);

// Obtener mensajes de un cliente específico
router.get('/chat/:clienteId', soporteController.verChatCliente);

// Enviar respuesta al chat de un cliente
router.post('/chat/:clienteId/responder', soporteController.enviarMensaje);

module.exports = router;
