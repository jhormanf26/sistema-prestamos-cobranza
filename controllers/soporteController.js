const SoporteMensajeModel = require('../models/SoporteMensajeModel');
const ClienteModel = require('../models/ClienteModel');
const pushService = require('../utils/pushService');

/**
 * Controlador administrativo para la gestión del Chat de Soporte técnico interno.
 */
const soporteController = {
    /**
     * Muestra la bandeja de entrada centralizada con todos los chats activos de los clientes.
     * @param {Object} req Objeto de petición de Express.
     * @param {Object} res Objeto de respuesta de Express.
     */
    listarChats: async (req, res) => {
        try {
            const chats = await SoporteMensajeModel.obtenerChatsActivos();
            res.render('soporte/index', {
                title: 'Bandeja de Soporte',
                chats,
                activePage: 'soporte'
            });
        } catch (error) {
            console.error("Error en soporteController.listarChats:", error);
            res.status(500).send('Error al cargar la bandeja de soporte');
        }
    },

    /**
     * Obtiene y devuelve el chat completo con un cliente específico y marca los mensajes del cliente como leídos.
     * @param {Object} req Objeto de petición de Express.
     * @param {Object} res Objeto de respuesta de Express.
     */
    verChatCliente: async (req, res) => {
        const { clienteId } = req.params;
        try {
            const cliente = await ClienteModel.obtenerPorId(clienteId);
            if (!cliente) {
                return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
            }

            const mensajes = await SoporteMensajeModel.obtenerChatCompleto(clienteId);

            // Marcar mensajes enviados por el cliente como leídos por el administrador
            await SoporteMensajeModel.marcarComoLeido(clienteId, 'cliente');

            res.json({
                success: true,
                cliente: {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    foto: cliente.foto,
                    dni: cliente.dni
                },
                mensajes
            });
        } catch (error) {
            console.error("Error en soporteController.verChatCliente:", error);
            res.status(500).json({ success: false, error: 'Error al obtener la conversación' });
        }
    },

    /**
     * Procesa la respuesta de un administrador, la almacena y dispara una notificación push al cliente.
     * @param {Object} req Objeto de petición de Express.
     * @param {Object} res Objeto de respuesta de Express.
     */
    enviarMensaje: async (req, res) => {
        const { clienteId } = req.params;
        const { mensaje } = req.body;
        const usuarioId = req.session.usuario ? req.session.usuario.id : null;

        if (!mensaje || mensaje.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Mensaje requerido' });
        }

        try {
            const cliente = await ClienteModel.obtenerPorId(clienteId);
            if (!cliente) {
                return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
            }

            // Registrar el mensaje del administrador en la base de datos
            await SoporteMensajeModel.enviarMensaje({
                cliente_id: clienteId,
                usuario_id: usuarioId,
                remitente: 'administrador',
                mensaje: mensaje.trim()
            });

            // Disparar Notificación Push nativa al dispositivo del cliente si tiene suscripción activa
            const payload = {
                title: 'Soporte - Nuevo Mensaje',
                body: mensaje.trim().length > 50 ? `${mensaje.trim().substring(0, 47)}...` : mensaje.trim(),
                icon: '/icons/icon-192x192.png',
                data: {
                    url: '/portal-cliente/chat'
                }
            };
            
            try {
                await pushService.sendPushToUser(clienteId, payload);
            } catch (e) {
                console.error("Error al enviar notificación push al cliente:", e);
            }

            res.json({ success: true, mensaje: mensaje.trim() });
        } catch (error) {
            console.error("Error en soporteController.enviarMensaje:", error);
            res.status(500).json({ success: false, error: 'Error al guardar respuesta' });
        }
    }
};

module.exports = soporteController;
