const db = require('../config/db');

/**
 * Representa el modelo para la gestión de documentos de clientes en la base de datos.
 */
class ClienteDocumentoModel {
    
    /**
     * Registra un nuevo documento en la base de datos.
     * 
     * @param {Object} datos - Datos del documento.
     * @param {number} datos.cliente_id - ID del cliente dueño del documento.
     * @param {string} datos.nombre_documento - Nombre descriptivo del documento (ej. 'Cédula').
     * @param {string} datos.archivo_url - Ruta relativa del archivo subido.
     * @param {string} [datos.subido_por='cliente'] - Quién subió el archivo ('cliente' o 'administrador').
     * @param {string} [datos.estado='pendiente'] - Estado inicial ('pendiente', 'aprobado', 'rechazado').
     * @returns {Promise<number>} Retorna el ID del documento insertado.
     */
    static async crear({ cliente_id, nombre_documento, archivo_url, subido_por = 'cliente', estado = 'pendiente' }) {
        const query = `
            INSERT INTO clientes_documentos (cliente_id, nombre_documento, archivo_url, subido_por, estado)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [cliente_id, nombre_documento, archivo_url, subido_por, estado]);
        return result.insertId;
    }

    /**
     * Obtiene todos los documentos asociados a un cliente específico.
     * 
     * @param {number} clienteId - ID del cliente.
     * @returns {Promise<Array>} Lista de documentos del cliente.
     */
    static async obtenerPorCliente(clienteId) {
        const query = `
            SELECT * FROM clientes_documentos 
            WHERE cliente_id = ? 
            ORDER BY fecha_subida DESC
        `;
        const [rows] = await db.query(query, [clienteId]);
        return rows;
    }

    /**
     * Obtiene un documento por su ID.
     * 
     * @param {number} id - ID del documento.
     * @returns {Promise<Object|null>} El documento si existe, o null si no se encuentra.
     */
    static async obtenerPorId(id) {
        const query = `
            SELECT cd.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.email as cliente_email 
            FROM clientes_documentos cd
            JOIN clientes c ON cd.cliente_id = c.id
            WHERE cd.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Actualiza el estado de aprobación y el motivo de rechazo de un documento.
     * 
     * @param {number} id - ID del documento.
     * @param {string} estado - Nuevo estado ('pendiente', 'aprobado', 'rechazado').
     * @param {string|null} [motivoRechazo=null] - Motivo si el documento es rechazado.
     * @returns {Promise<boolean>} Retorna true si se actualizó con éxito.
     */
    static async actualizarEstado(id, estado, motivoRechazo = null) {
        const query = `
            UPDATE clientes_documentos 
            SET estado = ?, motivo_rechazo = ? 
            WHERE id = ?
        `;
        const [result] = await db.query(query, [estado, motivoRechazo, id]);
        return result.affectedRows > 0;
    }

    /**
     * Elimina el registro de un documento de la base de datos.
     * 
     * @param {number} id - ID del documento a eliminar.
     * @returns {Promise<boolean>} Retorna true si se eliminó con éxito.
     */
    static async eliminar(id) {
        const query = 'DELETE FROM clientes_documentos WHERE id = ?';
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = ClienteDocumentoModel;
