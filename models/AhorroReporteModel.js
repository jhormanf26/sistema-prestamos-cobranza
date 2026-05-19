const db = require('../config/db');

class AhorroReporteModel {
    // Crear un reporte de aporte
    static async crear({ cuenta_id, cliente_id, monto, comprobante_url, observaciones }) {
        try {
            const query = `
                INSERT INTO reportes_aporte_ahorro 
                (cuenta_id, cliente_id, monto, comprobante_url, observaciones) 
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(query, [cuenta_id, cliente_id, monto, comprobante_url, observaciones]);
            return result.insertId;
        } catch (error) {
            console.error("Error al crear reporte de aporte de ahorro:", error);
            throw error;
        }
    }

    // Obtener los reportes de un cliente
    static async obtenerPorCliente(clienteId) {
        try {
            const query = `
                SELECT r.*, c.meta_nombre 
                FROM reportes_aporte_ahorro r
                JOIN cuentas_ahorro c ON r.cuenta_id = c.id
                WHERE r.cliente_id = ? 
                ORDER BY r.fecha_reporte DESC
            `;
            const [rows] = await db.query(query, [clienteId]);
            return rows;
        } catch (error) {
            console.error("Error al obtener reportes de aporte del cliente:", error);
            throw error;
        }
    }

    // Obtener todos los reportes pendientes (para admin)
    static async obtenerPendientes() {
        try {
            const query = `
                SELECT r.*, cl.nombre, cl.apellido, cl.dni
                FROM reportes_aporte_ahorro r
                JOIN clientes cl ON r.cliente_id = cl.id
                WHERE r.estado = 'pendiente'
                ORDER BY r.fecha_reporte ASC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Error al obtener reportes de aporte pendientes:", error);
            throw error;
        }
    }

    // Actualizar estado (aprobar o rechazar)
    static async actualizarEstado(id, estado, observaciones, validadorId) {
        try {
            const query = `
                UPDATE reportes_aporte_ahorro 
                SET estado = ?, observaciones = ?, fecha_validacion = NOW(), usuario_validador_id = ? 
                WHERE id = ?
            `;
            await db.query(query, [estado, observaciones, validadorId, id]);
            return true;
        } catch (error) {
            console.error("Error al actualizar estado del reporte de aporte:", error);
            throw error;
        }
    }

    // Obtener por ID
    static async obtenerPorId(id) {
        try {
            const query = 'SELECT * FROM reportes_aporte_ahorro WHERE id = ?';
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error al obtener reporte de aporte por ID:", error);
            throw error;
        }
    }
}

module.exports = AhorroReporteModel;
