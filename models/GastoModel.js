const db = require('../config/db');

class GastoModel {

    // 1. Obtener Paginados
    static async obtenerPaginados(limit, offset) {
        try {
            const query = 'SELECT * FROM gastos ORDER BY fecha_gasto DESC LIMIT ? OFFSET ?';
            const [rows] = await db.query(query, [limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Contar Total
    static async contarTotal() {
        try {
            const [rows] = await db.query('SELECT COUNT(*) as total FROM gastos');
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 3. Buscar Paginados
    static async buscarPaginados(busqueda, limit, offset) {
        try {
            const criterio = `%${busqueda}%`;
            const query = `
                SELECT * FROM gastos 
                WHERE descripcion LIKE ? OR categoria LIKE ? 
                ORDER BY fecha_gasto DESC 
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.query(query, [criterio, criterio, limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 4. Contar Búsqueda
    static async contarBusqueda(busqueda) {
        try {
            const criterio = `%${busqueda}%`;
            const query = `
                SELECT COUNT(*) as total FROM gastos 
                WHERE descripcion LIKE ? OR categoria LIKE ?
            `;
            const [rows] = await db.query(query, [criterio, criterio]);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 5. Crear Gasto (ACTUALIZADO CON NUEVOS CAMPOS)
    static async crear(datos) {
        try {
            const { descripcion, monto, categoria, registrado_por, observacion, fecha_gasto } = datos;
            const fechaValue = fecha_gasto ? `${fecha_gasto} 12:00:00` : new Date();
            const query = `
                INSERT INTO gastos (descripcion, monto, categoria, registrado_por, observacion, fecha_gasto) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(query, [descripcion, monto, categoria, registrado_por, observacion, fechaValue]);
            return result;
        } catch (error) {
            console.error("Error SQL al crear gasto:", error); // Esto te ayudará a ver el error en la terminal
            throw error;
        }
    }

    // 6. Eliminar Gasto
    static async eliminar(id) {
        try {
            const query = 'DELETE FROM gastos WHERE id = ?';
            const [result] = await db.query(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 7. Obtener Gasto por ID
    /**
     * Obtiene un gasto operativo específico por su ID.
     * @async
     * @method obtenerPorId
     * @param {number|string} id - ID del gasto a buscar.
     * @returns {Promise<Object|null>} El objeto del gasto si se encuentra, o null en caso contrario.
     */
    static async obtenerPorId(id) {
        try {
            const query = 'SELECT * FROM gastos WHERE id = ?';
            const [rows] = await db.query(query, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    // 8. Actualizar Gasto
    /**
     * Actualiza un gasto operativo en la base de datos.
     * @async
     * @method actualizar
     * @param {number|string} id - ID del gasto a actualizar.
     * @param {Object} datos - Nuevos datos del gasto.
     * @param {string} datos.descripcion - Nueva descripción.
     * @param {number} datos.monto - Nuevo monto.
     * @param {string} datos.categoria - Nueva categoría.
     * @param {string} datos.fecha_gasto - Nueva fecha.
     * @param {string} datos.observacion - Nueva observación.
     * @returns {Promise<Object>} El resultado de la consulta SQL.
     */
    static async actualizar(id, datos) {
        try {
            const { descripcion, monto, categoria, fecha_gasto, observacion } = datos;
            const fechaValue = fecha_gasto ? `${fecha_gasto} 12:00:00` : new Date();
            const query = `
                UPDATE gastos 
                SET descripcion = ?, monto = ?, categoria = ?, fecha_gasto = ?, observacion = ? 
                WHERE id = ?
            `;
            const [result] = await db.query(query, [descripcion, monto, categoria, fechaValue, observacion, id]);
            return result;
        } catch (error) {
            console.error("Error SQL al actualizar gasto:", error);
            throw error;
        }
    }
}

module.exports = GastoModel;