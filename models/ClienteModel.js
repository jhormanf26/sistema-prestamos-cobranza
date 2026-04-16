const db = require('../config/db');

class ClienteModel {
    
    // 1. Obtener paginados (MANTIENE PAGINACIÓN)
    static async obtenerPaginados(limit, offset) {
        try {
            // Agregamos 'estado' a la consulta para poder mostrarlo
            const query = 'SELECT * FROM clientes ORDER BY created_at DESC LIMIT ? OFFSET ?';
            const [rows] = await db.query(query, [limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 2. Contar total (MANTIENE PAGINACIÓN)
    static async contarTotal() {
        try {
            const [rows] = await db.query('SELECT COUNT(*) as total FROM clientes');
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 3. Crear cliente (MANTIENE FOTO)
    static async crear(datos) {
        try {
            const { dni, nombre, apellido, telefono, direccion, email, foto } = datos;
            // Insertamos con estado 1 (Activo) por defecto
            const query = `
                INSERT INTO clientes (dni, nombre, apellido, telefono, direccion, email, foto, estado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `;
            const [result] = await db.query(query, [dni, nombre, apellido, telefono, direccion, email, foto]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 4. Buscar por DNI (MANTIENE VALIDACIÓN)
    static async buscarPorDNI(dni) {
        try {
            const [rows] = await db.query('SELECT * FROM clientes WHERE dni = ?', [dni]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 5. Obtener Todos (PARA SELECTS)
    static async obtenerTodos() {
        try {
            const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre ASC');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 6. Buscador Paginado (MANTIENE BUSCADOR)
    static async buscarPaginados(criterio, limit, offset) {
        try {
            const busqueda = `%${criterio}%`;
            const query = `
                SELECT * FROM clientes 
                WHERE nombre LIKE ? OR apellido LIKE ? OR dni LIKE ? 
                ORDER BY nombre ASC 
                LIMIT ? OFFSET ?
            `;
            const [rows] = await db.query(query, [busqueda, busqueda, busqueda, limit, offset]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 7. Contar búsqueda (MANTIENE BUSCADOR)
    static async contarBusqueda(criterio) {
        try {
            const busqueda = `%${criterio}%`;
            const query = `
                SELECT COUNT(*) as total FROM clientes 
                WHERE nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?
            `;
            const [rows] = await db.query(query, [busqueda, busqueda, busqueda]);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // 8. Obtener por ID (MANTIENE PERFIL)
    static async obtenerPorId(id) {
        try {
            const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 9. Actualizar Cliente (MANTIENE EDICIÓN CON FOTO)
    static async actualizar(id, datos) {
        try {
            const { dni, nombre, apellido, telefono, direccion, email, foto } = datos;
            
            let query, params;
            
            if (foto) {
                query = `UPDATE clientes SET dni=?, nombre=?, apellido=?, telefono=?, direccion=?, email=?, foto=? WHERE id=?`;
                params = [dni, nombre, apellido, telefono, direccion, email, foto, id];
            } else {
                query = `UPDATE clientes SET dni=?, nombre=?, apellido=?, telefono=?, direccion=?, email=? WHERE id=?`;
                params = [dni, nombre, apellido, telefono, direccion, email, id];
            }

            const [result] = await db.query(query, params);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 10. (NUEVO) CAMBIAR ESTADO
    // Esta es la única función nueva que necesitas para solucionar el problema
    static async cambiarEstado(id, nuevoEstado) {
        try {
            const query = "UPDATE clientes SET estado = ? WHERE id = ?";
            const [result] = await db.query(query, [nuevoEstado, id]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ClienteModel;