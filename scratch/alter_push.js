const db = require('../config/db');

async function alterTable() {
    try {
        await db.query(`ALTER TABLE push_subscriptions ADD COLUMN device_info JSON DEFAULT NULL`);
        console.log("Column added successfully.");
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
