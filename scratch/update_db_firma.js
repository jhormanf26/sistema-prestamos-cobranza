const pool = require('../config/db');

async function updateDB() {
    try {
        console.log('Verificando tabla prestamos...');
        const [columns] = await pool.query(`SHOW COLUMNS FROM prestamos LIKE 'firma_digital'`);
        
        if (columns.length === 0) {
            console.log('Añadiendo columnas de firma digital...');
            await pool.query(`
                ALTER TABLE prestamos 
                ADD COLUMN firma_digital LONGTEXT NULL AFTER estado,
                ADD COLUMN fecha_firma DATETIME NULL AFTER firma_digital,
                ADD COLUMN ip_firma VARCHAR(50) NULL AFTER fecha_firma
            `);
            console.log('Columnas añadidas exitosamente.');
        } else {
            console.log('Las columnas ya existen en la tabla prestamos.');
        }

        // Actualizar el archivo bk_basededatos.sql (opcional pero recomendado si el sistema usa este archivo para respaldos iniciales)
        // Pero por ahora solo actualizaremos la BD real.
    } catch (error) {
        console.error('Error actualizando la base de datos:', error);
    } finally {
        process.exit();
    }
}

updateDB();
