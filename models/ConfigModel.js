const db = require('../config/db');

class ConfigModel {
    
    // Obtener datos
    static async obtener() {
        try {
            const query = "SELECT * FROM configuracion LIMIT 1";
            const [rows] = await db.query(query);
            return rows[0];
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // Guardar o Actualizar
    static async guardar(datos) {
        try {
            const actual = await this.obtener();

            if (actual) {
                // UPDATE: Si no hay logo nuevo, quitamos esa propiedad para no borrar el actual
                if (!datos.logo) {
                    delete datos.logo; 
                }
                const query = "UPDATE configuracion SET ? WHERE id = ?";
                await db.query(query, [datos, actual.id]);
                return actual.id;
            } else {
                // INSERT: Crear nuevo registro
                const query = "INSERT INTO configuracion SET ?";
                const [result] = await db.query(query, datos);
                return result.insertId;
            }
        } catch (error) {
            console.error("Error ConfigModel.guardar:", error);
            throw error; // Lanzar error para que el controlador lo capture
        }
    }
}

module.exports = ConfigModel;