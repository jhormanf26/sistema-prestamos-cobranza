const db = require('../config/db');
async function run() {
    try {
        const [rows] = await db.query("SELECT email, rol FROM usuarios");
        console.log("Usuarios:", rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
