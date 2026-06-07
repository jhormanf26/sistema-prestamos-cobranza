const pool = require('../config/db');

async function updateDB() {
    try {
        console.log('Verificando tabla prestamos para comprobantes de desembolso...');
        const [columns] = await pool.query(`SHOW COLUMNS FROM prestamos LIKE 'comprobante_desembolso'`);
        
        if (columns.length === 0) {
            console.log('Añadiendo columnas de desembolso...');
            await pool.query(`
                ALTER TABLE prestamos 
                ADD COLUMN comprobante_desembolso VARCHAR(255) NULL AFTER observaciones,
                ADD COLUMN notas_desembolso TEXT NULL AFTER comprobante_desembolso
            `);
            console.log('Columnas de desembolso añadidas exitosamente.');
        } else {
            console.log('Las columnas de desembolso ya existen en la tabla prestamos.');
        }
    } catch (error) {
        console.error('Error actualizando la base de datos:', error);
    } finally {
        process.exit();
    }
}

updateDB();
