const db = require('../config/db');

async function migrate() {
    try {
        console.log('Iniciando migración...');
        await db.query("ALTER TABLE prestamos ADD COLUMN tasa_mora DECIMAL(5,2) DEFAULT 0.00 AFTER tasa_interes");
        console.log('Columna tasa_mora añadida con éxito.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('La columna tasa_mora ya existe.');
            process.exit(0);
        } else {
            console.error('Error en la migración:', error);
            process.exit(1);
        }
    }
}

migrate();
