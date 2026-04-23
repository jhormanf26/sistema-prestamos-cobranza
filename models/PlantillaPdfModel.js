const db = require('../config/db');

class PlantillaPdfModel {

    static async obtenerTodas() {
        const [rows] = await db.query('SELECT * FROM plantillas_pdf ORDER BY nombre ASC');
        return rows;
    }

    static async obtenerPorSlug(slug) {
        const [rows] = await db.query('SELECT * FROM plantillas_pdf WHERE slug = ?', [slug]);
        return rows[0];
    }

    static async actualizar(id, datos) {
        const { contenido } = datos;
        const query = 'UPDATE plantillas_pdf SET contenido = ? WHERE id = ?';
        return await db.query(query, [contenido, id]);
    }
}

module.exports = PlantillaPdfModel;
