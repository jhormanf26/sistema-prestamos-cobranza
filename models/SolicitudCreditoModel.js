const db = require('../config/db');

/**
 * Modelo para gestionar las solicitudes de crédito por cupo pre-aprobado.
 */
class SolicitudCreditoModel {
    /**
     * Registra una nueva solicitud de crédito de cupo pre-aprobado.
     * @param {Object} datos Datos de la solicitud de crédito.
     * @param {number} datos.cliente_id ID del cliente.
     * @param {number} datos.monto_solicitado Monto solicitado por el cliente.
     * @param {number} datos.cuotas Número de cuotas deseadas.
     * @param {string} [datos.frecuencia] Frecuencia de cobro ('semanal', 'quincenal', 'mensual', 'diario', etc.).
     * @returns {Promise<Object>} Resultado de la consulta de inserción.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async crear(datos) {
        try {
            const { cliente_id, monto_solicitado, cuotas, frecuencia } = datos;
            const query = `
                INSERT INTO solicitudes_credito (cliente_id, monto_solicitado, cuotas, frecuencia, estado) 
                VALUES (?, ?, ?, ?, 'pendiente')
            `;
            const [result] = await db.query(query, [cliente_id, monto_solicitado, cuotas, frecuencia || 'mensual']);
            return result;
        } catch (error) {
            console.error("Error en SolicitudCreditoModel.crear:", error);
            throw error;
        }
    }

    /**
     * Obtiene una solicitud de crédito por su ID con información del cliente.
     * @param {number} id ID de la solicitud.
     * @returns {Promise<Object|null>} Objeto de la solicitud o null si no se encuentra.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT sc.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.dni as cliente_dni, c.monto_preaprobado as cliente_preaprobado
                FROM solicitudes_credito sc
                JOIN clientes c ON sc.cliente_id = c.id
                WHERE sc.id = ?
            `;
            const [rows] = await db.query(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error en SolicitudCreditoModel.obtenerPorId:", error);
            throw error;
        }
    }

    /**
     * Obtiene todas las solicitudes de crédito que están en estado pendiente.
     * @returns {Promise<Array>} Listado de solicitudes pendientes de aprobación.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async obtenerPendientes() {
        try {
            const query = `
                SELECT sc.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.dni as cliente_dni
                FROM solicitudes_credito sc
                JOIN clientes c ON sc.cliente_id = c.id
                WHERE sc.estado = 'pendiente'
                ORDER BY sc.fecha_solicitud DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Error en SolicitudCreditoModel.obtenerPendientes:", error);
            throw error;
        }
    }

    /**
     * Obtiene el listado de solicitudes hechas por un cliente.
     * @param {number} clienteId ID del cliente.
     * @returns {Promise<Array>} Listado de solicitudes del cliente.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async obtenerPorCliente(clienteId) {
        try {
            const query = `
                SELECT * FROM solicitudes_credito 
                WHERE cliente_id = ? 
                ORDER BY fecha_solicitud DESC
            `;
            const [rows] = await db.query(query, [clienteId]);
            return rows;
        } catch (error) {
            console.error("Error en SolicitudCreditoModel.obtenerPorCliente:", error);
            throw error;
        }
    }

    /**
     * Resuelve una solicitud de crédito, permitiendo al administrador corregir parámetros como el monto, cuotas y frecuencia.
     * @param {number} id ID de la solicitud.
     * @param {string} estado Estado nuevo ('aprobado', 'rechazado').
     * @param {string} [comentarios] Comentarios u observaciones de la resolución.
     * @param {number} usuarioResolutorId ID del usuario administrador que procesa.
     * @param {number} [montoAprobado] Monto finalmente aprobado (si difiere del solicitado).
     * @param {number} [cuotasAprobadas] Número de cuotas finalmente aprobado.
     * @param {string} [frecuenciaAprobada] Frecuencia de cobro finalmente aprobada.
     * @returns {Promise<Object>} Resultado de la actualización.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async resolverSolicitud(id, estado, comentarios, usuarioResolutorId, montoAprobado, cuotasAprobadas, frecuenciaAprobada) {
        try {
            let query = `
                UPDATE solicitudes_credito 
                SET estado = ?, comentarios = ?, usuario_resolutor_id = ?, fecha_resolucion = NOW()
            `;
            const params = [estado, comentarios || null, usuarioResolutorId];

            if (montoAprobado !== undefined && montoAprobado !== null) {
                query += `, monto_solicitado = ?`;
                params.push(montoAprobado);
            }
            if (cuotasAprobadas !== undefined && cuotasAprobadas !== null) {
                query += `, cuotas = ?`;
                params.push(cuotasAprobadas);
            }
            if (frecuenciaAprobada !== undefined && frecuenciaAprobada !== null) {
                query += `, frecuencia = ?`;
                params.push(frecuenciaAprobada);
            }

            query += ` WHERE id = ?`;
            params.push(id);

            const [result] = await db.query(query, params);
            return result;
        } catch (error) {
            console.error("Error en SolicitudCreditoModel.resolverSolicitud:", error);
            throw error;
        }
    }
}

module.exports = SolicitudCreditoModel;
