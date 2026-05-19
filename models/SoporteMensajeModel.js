const db = require('../config/db');

/**
 * Modelo para la gestión de mensajes del chat de soporte bidireccional.
 */
class SoporteMensajeModel {
    /**
     * Registra un nuevo mensaje en el chat.
     * @param {Object} datos Datos del mensaje.
     * @param {number} datos.cliente_id ID del cliente asociado al chat.
     * @param {number} [datos.usuario_id] ID del usuario administrador que envía el mensaje (NULL si es del cliente).
     * @param {string} datos.remitente Quién envía el mensaje ('cliente', 'administrador').
     * @param {string} datos.mensaje Contenido del mensaje de texto o ruta del archivo de audio.
     * @param {string} [datos.tipo] Tipo del mensaje ('texto', 'audio'). Por defecto 'texto'.
     * @returns {Promise<Object>} Resultado de la consulta de inserción.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async enviarMensaje(datos) {
        try {
            const { cliente_id, usuario_id, remitente, mensaje, tipo = 'texto' } = datos;
            const query = `
                INSERT INTO soporte_mensajes (cliente_id, usuario_id, remitente, mensaje, tipo, leido) 
                VALUES (?, ?, ?, ?, ?, 0)
            `;
            const [result] = await db.query(query, [cliente_id, usuario_id || null, remitente, mensaje, tipo]);
            return result;
        } catch (error) {
            console.error("Error en SoporteMensajeModel.enviarMensaje:", error);
            throw error;
        }
    }

    /**
     * Obtiene el historial completo de mensajes de un cliente ordenados por fecha.
     * @param {number} clienteId ID del cliente.
     * @returns {Promise<Array>} Listado de mensajes de chat.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async obtenerChatCompleto(clienteId) {
        try {
            const query = `
                SELECT sm.*, u.nombre_completo as admin_nombre, '' as admin_apellido, c.nombre as cliente_nombre
                FROM soporte_mensajes sm
                LEFT JOIN usuarios u ON sm.usuario_id = u.id
                JOIN clientes c ON sm.cliente_id = c.id
                WHERE sm.cliente_id = ?
                ORDER BY sm.fecha_envio ASC
            `;
            const [rows] = await db.query(query, [clienteId]);
            return rows;
        } catch (error) {
            console.error("Error en SoporteMensajeModel.obtenerChatCompleto:", error);
            throw error;
        }
    }

    /**
     * Obtiene una lista de conversaciones activas con los clientes, indicando
     * el último mensaje, su fecha y la cantidad de mensajes sin leer por parte de los administradores.
     * @returns {Promise<Array>} Listado de chats activos y resumidos.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async obtenerChatsActivos() {
        try {
            // Marcar automáticamente todos los mensajes pendientes de clientes como entregados al consultar la bandeja
            try {
                await db.query(`
                    UPDATE soporte_mensajes 
                    SET fecha_entregado = IFNULL(fecha_entregado, CURRENT_TIMESTAMP) 
                    WHERE remitente = 'cliente' AND fecha_entregado IS NULL
                `);
            } catch (e) {
                console.error("Error al auto-marcar entregados en obtenerChatsActivos:", e.message);
            }

            const query = `
                SELECT 
                    c.id as cliente_id, 
                    c.nombre as cliente_nombre, 
                    c.apellido as cliente_apellido, 
                    c.dni as cliente_dni,
                    c.foto as cliente_foto,
                    (SELECT mensaje FROM soporte_mensajes WHERE cliente_id = c.id ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
                    (SELECT fecha_envio FROM soporte_mensajes WHERE cliente_id = c.id ORDER BY fecha_envio DESC LIMIT 1) as fecha_ultimo_mensaje,
                    (SELECT COUNT(*) FROM soporte_mensajes WHERE cliente_id = c.id AND remitente = 'cliente' AND leido = 0) as sin_leer
                FROM clientes c
                WHERE EXISTS (SELECT 1 FROM soporte_mensajes WHERE cliente_id = c.id)
                ORDER BY fecha_ultimo_mensaje DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Error en SoporteMensajeModel.obtenerChatsActivos:", error);
            throw error;
        }
    }

    /**
     * Marca como leídos los mensajes de un remitente específico para un cliente, registrando el timestamp del visto.
     * @param {number} clienteId ID del cliente.
     * @param {string} remitente Quién envió los mensajes que queremos marcar como leídos ('cliente', 'administrador').
     * @returns {Promise<Object>} Resultado de la actualización de MySQL.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async marcarComoLeido(clienteId, remitente) {
        try {
            const query = `
                UPDATE soporte_mensajes 
                SET leido = 1,
                    fecha_visto = IFNULL(fecha_visto, CURRENT_TIMESTAMP),
                    fecha_entregado = IFNULL(fecha_entregado, CURRENT_TIMESTAMP)
                WHERE cliente_id = ? AND remitente = ? AND leido = 0
            `;
            const [result] = await db.query(query, [clienteId, remitente]);
            return result;
        } catch (error) {
            console.error("Error en SoporteMensajeModel.marcarComoLeido:", error);
            throw error;
        }
    }

    /**
     * Marca como entregados los mensajes de un remitente específico para un cliente, registrando la fecha de entrega.
     * @param {number} clienteId ID del cliente.
     * @param {string} remitente Quién envió los mensajes que queremos marcar como entregados ('cliente', 'administrador').
     * @returns {Promise<Object>} Resultado de la actualización de MySQL.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async marcarComoEntregado(clienteId, remitente) {
        try {
            const query = `
                UPDATE soporte_mensajes 
                SET fecha_entregado = IFNULL(fecha_entregado, CURRENT_TIMESTAMP) 
                WHERE cliente_id = ? AND remitente = ? AND fecha_entregado IS NULL
            `;
            const [result] = await db.query(query, [clienteId, remitente]);
            return result;
        } catch (error) {
            console.error("Error en SoporteMensajeModel.marcarComoEntregado:", error);
            throw error;
        }
    }
}

module.exports = SoporteMensajeModel;
