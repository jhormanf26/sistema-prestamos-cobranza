const db = require('../config/db');

class EmpenoModel {

    // 1. Obtener todos los empeños (MANTIENE TU CÓDIGO ACTUAL)
    static async obtenerTodos() {
        try {
            const query = `
                SELECT e.*, c.nombre, c.apellido, c.dni 
                FROM empenos e 
                JOIN clientes c ON e.cliente_id = c.id 
                ORDER BY e.id DESC`;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Error en EmpenoModel.obtenerTodos:", error);
            throw error;
        }
    }

    // 2. Obtener un empeño por ID (MANTIENE TU CÓDIGO ACTUAL)
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT e.*, c.nombre, c.apellido, c.dni, c.email 
                FROM empenos e 
                JOIN clientes c ON e.cliente_id = c.id 
                WHERE e.id = ?`;
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error en EmpenoModel.obtenerPorId:", error);
            throw error;
        }
    }

    // --- ESTA ES LA FUNCIÓN QUE FALTABA Y CAUSABA EL ERROR ---
    static async obtenerPorCliente(cliente_id) {
        try {
            const query = `
                SELECT * FROM empenos 
                WHERE cliente_id = ? 
                ORDER BY created_at DESC`;
            const [rows] = await db.query(query, [cliente_id]);
            return rows;
        } catch (error) {
            console.error("Error en EmpenoModel.obtenerPorCliente:", error);
            return []; // Retornamos array vacío para no romper el perfil
        }
    }
    // ---------------------------------------------------------

    // 3. Crear nuevo empeño (MANTIENE TU CÓDIGO ACTUAL)
    static async crear(data) {
        try {
            const query = 'INSERT INTO empenos SET ?';
            const [result] = await db.query(query, data);
            return result.insertId;
        } catch (error) {
            console.error("Error en EmpenoModel.crear:", error);
            throw error;
        }
    }

    // 4. Actualizar Estado (MANTIENE TU CÓDIGO ACTUAL)
    static async actualizarEstado(id, nuevoEstado, montoRecuperado, fechaRetiro) {
        try {
            const query = `
                UPDATE empenos 
                SET estado = ?, 
                    monto_recuperado = ?, 
                    fecha_retiro = ? 
                WHERE id = ?`;
            
            const [result] = await db.query(query, [nuevoEstado, montoRecuperado, fechaRetiro, id]);
            return result;
        } catch (error) {
            console.error("Error en EmpenoModel.actualizarEstado:", error);
            throw error;
        }
    }
}

module.exports = EmpenoModel;