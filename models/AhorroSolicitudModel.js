const db = require('../config/db');

class AhorroSolicitudModel {
    // Crear una solicitud de retiro
    static async crear({ cuenta_id, cliente_id, monto_solicitado, comentarios }) {
        try {
            const query = `
                INSERT INTO solicitudes_retiro_ahorro 
                (cuenta_id, cliente_id, monto_solicitado, comentarios) 
                VALUES (?, ?, ?, ?)
            `;
            const [result] = await db.query(query, [cuenta_id, cliente_id, monto_solicitado, comentarios]);
            return result.insertId;
        } catch (error) {
            console.error("Error al crear solicitud de retiro de ahorro:", error);
            throw error;
        }
    }

    // Obtener las solicitudes de un cliente
    static async obtenerPorCliente(clienteId) {
        try {
            const query = `
                SELECT s.*, c.meta_nombre 
                FROM solicitudes_retiro_ahorro s
                JOIN cuentas_ahorro c ON s.cuenta_id = c.id
                WHERE s.cliente_id = ? 
                ORDER BY s.fecha_solicitud DESC
            `;
            const [rows] = await db.query(query, [clienteId]);
            return rows;
        } catch (error) {
            console.error("Error al obtener solicitudes de retiro del cliente:", error);
            throw error;
        }
    }

    // Obtener todas las solicitudes pendientes (para admin)
    static async obtenerPendientes() {
        try {
            const query = `
                SELECT s.*, cl.nombre, cl.apellido, cl.dni, c.saldo_actual
                FROM solicitudes_retiro_ahorro s
                JOIN clientes cl ON s.cliente_id = cl.id
                JOIN cuentas_ahorro c ON s.cuenta_id = c.id
                WHERE s.estado = 'pendiente'
                ORDER BY s.fecha_solicitud ASC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Error al obtener solicitudes de retiro pendientes:", error);
            throw error;
        }
    }

    // Actualizar estado (aprobar o rechazar)
    static async actualizarEstado(id, estado, comentarios, resolutorId) {
        try {
            const query = `
                UPDATE solicitudes_retiro_ahorro 
                SET estado = ?, comentarios = ?, fecha_resolucion = NOW(), usuario_resolutor_id = ? 
                WHERE id = ?
            `;
            await db.query(query, [estado, comentarios, resolutorId, id]);
            return true;
        } catch (error) {
            console.error("Error al actualizar estado de solicitud de retiro:", error);
            throw error;
        }
    }

    // Obtener por ID
    static async obtenerPorId(id) {
        try {
            const query = 'SELECT * FROM solicitudes_retiro_ahorro WHERE id = ?';
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error al obtener solicitud de retiro por ID:", error);
            throw error;
        }
    }
}

module.exports = AhorroSolicitudModel;
