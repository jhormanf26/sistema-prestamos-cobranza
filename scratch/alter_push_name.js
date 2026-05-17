const db = require('../config/db');

async function alterTable() {
    try {
        await db.query(`ALTER TABLE push_subscriptions ADD COLUMN nombre_dispositivo VARCHAR(100) DEFAULT NULL`);
        console.log("Column nombre_dispositivo added successfully.");
        process.exit(0);
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
            process.exit(0);
        } else {
            console.error("Error:", e);
            process.exit(1);
        }
    }
}

alterTable();
