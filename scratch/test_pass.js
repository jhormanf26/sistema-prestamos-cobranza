const mysql = require('mysql2/promise');

const passwords = ['', 'root', '123456', 'admin', '1234', 'mysql', 'password', 'root123', '12345678', 'system'];

async function checkPasswords() {
    for (const pass of passwords) {
        try {
            const conn = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pass
            });
            console.log(`✅ ¡ÉXITO! La contraseña de MySQL root es: "${pass}"`);
            await conn.end();
            return pass;
        } catch (e) {
            console.log(`Intentado '${pass}': ${e.code}`);
        }
    }
    console.log("❌ Ninguna contraseña común funcionó.");
    return null;
}

checkPasswords();
