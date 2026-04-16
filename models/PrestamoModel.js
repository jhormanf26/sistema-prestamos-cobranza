const db = require('../config/db');

class PrestamoModel {

    // 1. Obtener paginados
    static async obtenerPaginados(limit, offset) {
        try {
            const query = `
                SELECT p.*, c.nombre, c.apellido, c.dni 
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                ORDER BY p.fecha_inicio DESC
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.query(query, [limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Contar total
    static async contarTotal() {
        try {
            const [rows] = await db.query('SELECT COUNT(*) as total FROM prestamos');
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 3. Buscar paginados
    static async buscarPaginados(criterio, limit, offset) {
        try {
            const busqueda = `%${criterio}%`;
            const query = `
                SELECT p.*, c.nombre, c.apellido, c.dni 
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                WHERE c.nombre LIKE ? OR c.apellido LIKE ? OR p.id LIKE ?
                ORDER BY p.fecha_inicio DESC
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.query(query, [busqueda, busqueda, busqueda, limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 4. Contar búsqueda
    static async contarBusqueda(criterio) {
        try {
            const busqueda = `%${criterio}%`;
            const query = `
                SELECT COUNT(*) as total 
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                WHERE c.nombre LIKE ? OR c.apellido LIKE ? OR p.id LIKE ?
            `;
            const [rows] = await db.query(query, [busqueda, busqueda, busqueda]);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 5. Crear
    static async crear(datos) {
        try {
            const { 
                cliente_id, monto_prestado, tasa_interes, 
                monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin 
            } = datos;

            const query = `
                INSERT INTO prestamos 
                (cliente_id, monto_prestado, tasa_interes, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.query(query, [
                cliente_id, monto_prestado, tasa_interes, 
                monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin
            ]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 6. Obtener por ID
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT p.*, c.nombre, c.apellido, c.dni, c.email 
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                WHERE p.id = ?
            `;
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 7. Actualizar Estado
    static async actualizarEstado(id, nuevoEstado) {
        try {
            const query = 'UPDATE prestamos SET estado = ? WHERE id = ?';
            const [result] = await db.query(query, [nuevoEstado, id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 8. Obtener Todos (Excel)
    static async obtenerTodos() {
        try {
            const query = `
                SELECT p.*, c.nombre, c.apellido, c.dni 
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                ORDER BY p.fecha_inicio DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 9. Obtener por Cliente
    static async obtenerPorCliente(clienteId) {
        try {
            const query = 'SELECT * FROM prestamos WHERE cliente_id = ? ORDER BY fecha_inicio DESC';
            const [rows] = await db.query(query, [clienteId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 10. (NUEVO) Procesar Vencimientos Automáticos
    // Busca préstamos pendientes cuya fecha fin sea menor a hoy y los marca como 'vencido'
    static async procesarVencimientos() {
        try {
            const query = `
                UPDATE prestamos 
                SET estado = 'vencido' 
                WHERE fecha_fin < CURDATE() AND estado = 'pendiente'
            `;
            await db.query(query);
        } catch (error) {
            console.error('Error procesando vencimientos:', error);
        }
    }

    // 11. (NUEVO) Contar cuántos están vencidos (Para la notificación)
    static async contarVencidos() {
        try {
            const [rows] = await db.query("SELECT COUNT(*) as total FROM prestamos WHERE estado = 'vencido'");
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 12. (NUEVO) Obtener lista de morosos
    static async obtenerVencidos() {
        try {
            const query = `
                SELECT p.*, c.nombre, c.apellido, c.dni, c.telefono 
                FROM prestamos p
                INNER JOIN clientes c ON p.cliente_id = c.id
                WHERE p.estado = 'vencido'
                ORDER BY p.fecha_fin ASC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PrestamoModel;