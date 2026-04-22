const db = require('../config/db');

class PlantillaModel {

    static async obtenerTodas() {
        const [rows] = await db.query('SELECT * FROM plantillas_correo ORDER BY nombre ASC');
        return rows;
    }

    static async obtenerPorSlug(slug) {
        const [rows] = await db.query('SELECT * FROM plantillas_correo WHERE slug = ?', [slug]);
        return rows[0];
    }

    static async actualizar(id, datos) {
        const { asunto, html_content } = datos;
        const query = 'UPDATE plantillas_correo SET asunto = ?, html_content = ? WHERE id = ?';
        return await db.query(query, [asunto, html_content, id]);
    }
}

module.exports = PlantillaModel;
