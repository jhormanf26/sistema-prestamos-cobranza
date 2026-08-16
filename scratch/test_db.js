const db = require('../config/db');

async function testConnection() {
    try {
        const [rows] = await db.query("SELECT id, nombre_completo, email, rol, password FROM usuarios");
        console.log("✅ CONEXIÓN A MYSQL EXITOSA! Usuarios encontrados en la BD:");
        console.log(rows);
    } catch (error) {
        console.error("❌ ERROR AL CONSULTAR LA BASE DE DATOS:");
        console.error(error.message);
    }
    process.exit(0);
}

testConnection();
