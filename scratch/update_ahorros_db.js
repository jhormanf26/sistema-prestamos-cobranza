const db = require('../config/db');

async function updateTable() {
    try {
        console.log('Iniciando actualización de tabla cuentas_ahorro...');
        await db.query(`ALTER TABLE cuentas_ahorro ADD COLUMN meta_monto DECIMAL(12,2) DEFAULT NULL`);
        await db.query(`ALTER TABLE cuentas_ahorro ADD COLUMN meta_nombre VARCHAR(100) DEFAULT NULL`);
        console.log('✅ Tabla actualizada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al actualizar la tabla:', error.message);
        process.exit(1);
    }
}

updateTable();
