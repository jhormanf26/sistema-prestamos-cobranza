const db = require('../config/db');

async function updateConfigDb() {
    try {
        console.log("Adding modulos_activos JSON column to configuracion...");
        
        // Add column if it doesn't exist (MySQL check using try/catch on failure)
        try {
            await db.query("ALTER TABLE configuracion ADD COLUMN modulos_activos JSON;");
            console.log("Column added.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column already exists.");
            } else {
                throw e;
            }
        }

        // Set default value for existing row
        const defaultJSON = '{"clientes":true, "prestamos":true, "simulador":true, "gastos":true, "reportes":true, "empenos":true, "ahorros":true, "cadenas":true, "promocion":true}';
        await db.query("UPDATE configuracion SET modulos_activos = ? WHERE modulos_activos IS NULL", [defaultJSON]);
        
        console.log("Config table updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

updateConfigDb();
