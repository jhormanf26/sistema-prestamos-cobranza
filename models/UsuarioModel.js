const db = require('../config/db');

class UsuarioModel {
    
    // 1. Buscar por email (Login) - SE MANTIENE
    static async buscarPorEmail(email) {
        try {
            const query = 'SELECT * FROM usuarios WHERE email = ?';
            const [rows] = await db.query(query, [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 2. Buscar por ID (Perfil) - SE MANTIENE
    static async buscarPorId(id) {
        try {
            const query = 'SELECT * FROM usuarios WHERE id = ?';
            const [rows] = await db.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 3. Obtener todos (Admin) - SE MANTIENE
    static async obtenerTodos() {
        try {
            const query = 'SELECT id, nombre_completo, email, rol, estado, created_at FROM usuarios ORDER BY id DESC';
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 4. Crear usuario - SE MANTIENE
    static async crear(datos) {
        try {
            const { nombre_completo, email, password, rol } = datos;
            // Estado 1 = Activo por defecto
            const query = `
                INSERT INTO usuarios (nombre_completo, email, password, rol, estado) 
                VALUES (?, ?, ?, ?, 1) 
            `;
            const [result] = await db.query(query, [nombre_completo, email, password, rol]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 5. Eliminar usuario (SE MANTIENE POR SEGURIDAD, AUNQUE NO SE USE EN EL BOTÓN)
    static async eliminar(id) {
        try {
            const query = 'DELETE FROM usuarios WHERE id = ?';
            const [result] = await db.query(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 6. Actualizar Datos Básicos (Perfil) - SE MANTIENE
    static async actualizarDatos(id, nombre, email) {
        try {
            const query = 'UPDATE usuarios SET nombre_completo = ?, email = ? WHERE id = ?';
            const [result] = await db.query(query, [nombre, email, id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 7. Actualizar Contraseña - SE MANTIENE
    static async actualizarPassword(id, passwordHash) {
        try {
            const query = 'UPDATE usuarios SET password = ? WHERE id = ?';
            const [result] = await db.query(query, [passwordHash, id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // 8. (NUEVO) CAMBIAR ESTADO
    static async cambiarEstado(id, nuevoEstado) {
        try {
            // nuevoEstado será 1 (Activo) o 0 (Inactivo)
            const query = 'UPDATE usuarios SET estado = ? WHERE id = ?';
            const [result] = await db.query(query, [nuevoEstado, id]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UsuarioModel;