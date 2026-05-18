const db = require('../config/db');

async function updateDb() {
    try {
        await db.query("ALTER TABLE clientes ADD COLUMN app_instalada TINYINT(1) DEFAULT 0;");
        console.log("Columna app_instalada añadida a clientes.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("La columna app_instalada ya existe.");
        } else {
            console.error("Error al alterar la tabla clientes:", e);
        }
    }
    process.exit(0);
}

updateDb();
