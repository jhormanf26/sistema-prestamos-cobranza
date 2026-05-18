const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function updateDb() {
    try {
        console.log('Agregando columna password a clientes...');
        try {
            await db.query('ALTER TABLE clientes ADD COLUMN password VARCHAR(255) NULL AFTER email');
            console.log('Columna agregada.');
        } catch(e) {
            if(e.code === 'ER_DUP_FIELDNAME') {
                console.log('La columna password ya existe.');
            } else {
                throw e;
            }
        }

        console.log('Actualizando contraseñas por defecto (DNI) para clientes existentes sin contraseña...');
        const [clientes] = await db.query('SELECT id, dni FROM clientes WHERE password IS NULL OR password = ""');
        for (let cliente of clientes) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(cliente.dni, salt);
            await db.query('UPDATE clientes SET password = ? WHERE id = ?', [hash, cliente.id]);
        }
        console.log(`Se actualizaron ${clientes.length} clientes.`);
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateDb();
