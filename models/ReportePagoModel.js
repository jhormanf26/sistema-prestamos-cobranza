const db = require('../config/db');

/**
 * Modelo para gestionar reportes de pago y comprobantes en el sistema.
 */
class ReportePagoModel {
    /**
     * Crea un nuevo reporte de pago (subida de comprobante).
     * @param {Object} datos Datos del reporte de pago.
     * @param {number} datos.prestamo_id ID del préstamo.
     * @param {number} datos.cliente_id ID del cliente.
     * @param {number} datos.monto Monto reportado por el cliente.
     * @param {string} datos.comprobante_url Ruta de la imagen del comprobante.
     * @param {string} [datos.observaciones] Observaciones adicionales del cliente.
     * @returns {Promise<Object>} Resultado de la inserción de MySQL.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async crear(datos) {
        try {
            const { prestamo_id, cliente_id, monto, comprobante_url, observaciones } = datos;
            const query = `
                INSERT INTO reportes_pago (prestamo_id, cliente_id, monto, comprobante_url, observaciones, estado) 
                VALUES (?, ?, ?, ?, ?, 'pendiente')
            `;
            const [result] = await db.query(query, [prestamo_id, cliente_id, monto, comprobante_url, observaciones || null]);
            return result;
        } catch (error) {
            console.error("Error en ReportePagoModel.crear:", error);
            throw error;
        }
    }

    /**
     * Obtiene un reporte de pago por su ID con información detallada.
     * @param {number} id ID del reporte de pago.
     * @returns {Promise<Object|null>} Objeto del reporte de pago o null si no existe.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT rp.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.dni as cliente_dni, p.monto_total as prestamo_monto
                FROM reportes_pago rp
                JOIN clientes c ON rp.cliente_id = c.id
                JOIN prestamos p ON rp.prestamo_id = p.id
                WHERE rp.id = ?
            `;
            const [rows] = await db.query(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error en ReportePagoModel.obtenerPorId:", error);
            throw error;
        }
    }

    /**
     * Obtiene todos los reportes de pago que se encuentran en estado pendiente.
     * @returns {Promise<Array>} Listado de reportes de pago pendientes.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async obtenerPendientes() {
        try {
            const query = `
                SELECT rp.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.dni as cliente_dni
                FROM reportes_pago rp
                JOIN clientes c ON rp.cliente_id = c.id
                WHERE rp.estado = 'pendiente'
                ORDER BY rp.fecha_reporte DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Error en ReportePagoModel.obtenerPendientes:", error);
            throw error;
        }
    }

    /**
     * Obtiene todos los reportes de pago asociados a un cliente específico.
     * @param {number} clienteId ID del cliente.
     * @returns {Promise<Array>} Listado de reportes del cliente.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async obtenerPorCliente(clienteId) {
        try {
            const query = `
                SELECT rp.*, p.monto_total as prestamo_monto
                FROM reportes_pago rp
                JOIN prestamos p ON rp.prestamo_id = p.id
                WHERE rp.cliente_id = ?
                ORDER BY rp.fecha_reporte DESC
            `;
            const [rows] = await db.query(query, [clienteId]);
            return rows;
        } catch (error) {
            console.error("Error en ReportePagoModel.obtenerPorCliente:", error);
            throw error;
        }
    }

    /**
     * Actualiza el estado de un reporte de pago.
     * Permite ajustar el monto final (en caso de corrección por el administrador).
     * @param {number} id ID del reporte de pago.
     * @param {string} estado Nuevo estado ('aprobado', 'rechazado').
     * @param {string} [observaciones] Comentarios del administrador (p. ej., motivo de rechazo o nota de ajuste).
     * @param {number} usuarioValidadorId ID del usuario administrador que realiza la validación.
     * @param {number} [montoReal] El monto real aprobado tras la revisión del comprobante.
     * @returns {Promise<Object>} Resultado de la actualización.
     * @throws {Error} Si hay un error en la base de datos.
     */
    static async resolverReporte(id, estado, observaciones, usuarioValidadorId, montoReal) {
        try {
            let query, params;
            if (montoReal !== undefined) {
                query = `
                    UPDATE reportes_pago 
                    SET estado = ?, observaciones = ?, usuario_validador_id = ?, monto = ?, fecha_validacion = NOW() 
                    WHERE id = ?
                `;
                params = [estado, observaciones || null, usuarioValidadorId, montoReal, id];
            } else {
                query = `
                    UPDATE reportes_pago 
                    SET estado = ?, observaciones = ?, usuario_validador_id = ?, fecha_validacion = NOW() 
                    WHERE id = ?
                `;
                params = [estado, observaciones || null, usuarioValidadorId, id];
            }
            const [result] = await db.query(query, params);
            return result;
        } catch (error) {
            console.error("Error en ReportePagoModel.resolverReporte:", error);
            throw error;
        }
    }
}

module.exports = ReportePagoModel;
