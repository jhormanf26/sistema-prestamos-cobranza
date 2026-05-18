const db = require('../config/db');

async function updateDb() {
    try {
        await db.query("ALTER TABLE clientes ADD COLUMN ultimo_login DATETIME NULL DEFAULT NULL;");
        console.log("Columna ultimo_login añadida a clientes.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("La columna ultimo_login ya existe.");
        } else {
            console.error("Error al alterar la tabla clientes:", e);
        }
    }
    process.exit(0);
}

updateDb();
