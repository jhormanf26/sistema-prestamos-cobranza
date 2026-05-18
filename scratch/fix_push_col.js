const db = require('../config/db');

async function fixColumn() {
    try {
        await db.query(`ALTER TABLE push_subscriptions MODIFY COLUMN ultima_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        console.log("Column ultima_conexion modified successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

fixColumn();
