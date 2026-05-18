const db = require('../config/db');

async function test() {
    const [rows] = await db.query('DESCRIBE clientes');
    console.log(rows);
    process.exit();
}

test();
