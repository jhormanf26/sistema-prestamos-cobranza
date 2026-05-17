const db = require('../config/db');

async function updateEnum() {
    try {
        console.log("Updating ENUM for frecuencia in prestamos...");
        await db.query("ALTER TABLE prestamos MODIFY COLUMN frecuencia ENUM('diario', 'semanal', 'quincenal', 'mensual', 'bimensual', 'trimensual') NOT NULL DEFAULT 'mensual';");
        console.log("ENUM updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error updating ENUM:", err);
        process.exit(1);
    }
}

updateEnum();
