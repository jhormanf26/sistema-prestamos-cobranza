require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDb() {
    console.log('--- INICIANDO ACTUALIZACIÓN DE BASE DE DATOS ---');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    });

    console.log(`✅ Conectado a la base de datos: ${process.env.DB_NAME}`);

    try {
        await connection.query('ALTER TABLE reportes_pago MODIFY comprobante_url VARCHAR(255) NULL');
        console.log('✅ Tabla "reportes_pago" actualizada. comprobante_url ahora es NULL.');
        
        await connection.query('ALTER TABLE reportes_aporte_ahorro MODIFY comprobante_url VARCHAR(255) NULL');
        console.log('✅ Tabla "reportes_aporte_ahorro" actualizada. comprobante_url ahora es NULL.');

        console.log('\n¡ACTUALIZACIÓN COMPLETADA CON ÉXITO! 🚀');

    } catch (error) {
        console.error('❌ ERROR AL ACTUALIZAR TABLAS:', error.message);
    } finally {
        await connection.end();
    }
}

updateDb();
