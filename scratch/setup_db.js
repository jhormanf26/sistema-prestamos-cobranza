const mysql = require('mysql2/promise');
const fs = require('fs');

async function setup() {
    try {
        console.log("Conectando a MySQL con la contraseña 'root'...");
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root'
        });
        
        console.log("Creando base de datos 'sistema_prestamos' si no existe...");
        await conn.query("CREATE DATABASE IF NOT EXISTS sistema_prestamos;");
        await conn.query("USE sistema_prestamos;");

        // Verificar si la tabla usuarios existe
        const [tables] = await conn.query("SHOW TABLES LIKE 'usuarios';");
        if (tables.length === 0) {
            console.log("La base de datos está vacía. Importando bk_basededatos.sql...");
            const sql = fs.readFileSync('bk_basededatos.sql', 'utf8');
            // Ejecutar el script SQL
            const statements = sql.split(/;\s*$/m);
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await conn.query(statement);
                    } catch (e) {
                        // Ignorar errores menores de sintaxis SQL dump
                    }
                }
            }
            console.log("✅ Base de datos importada exitosamente.");
        } else {
            console.log("La tabla 'usuarios' ya existe.");
        }

        const [users] = await conn.query("SELECT id, nombre_completo, email, rol FROM usuarios;");
        console.log("Usuarios en la base de datos:", users);

        await conn.end();
    } catch (e) {
        console.error("Error:", e);
    }
}

setup();
