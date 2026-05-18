const db = require('../config/db');

async function updateDb() {
    try {
        await db.query("ALTER TABLE push_subscriptions ADD COLUMN cliente_id INT NULL DEFAULT NULL;");
        console.log("Columna cliente_id añadida a push_subscriptions.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("La columna cliente_id ya existe.");
        } else {
            console.error("Error al alterar la tabla push_subscriptions:", e);
        }
    }
    process.exit(0);
}

updateDb();
