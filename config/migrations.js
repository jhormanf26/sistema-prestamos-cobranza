const db = require('./db');
const bcrypt = require('bcryptjs');

/**
 * Ejecuta migraciones automáticas para asegurar que la base de datos
 * tenga las últimas columnas y tablas necesarias sin requerir intervención manual en producción.
 */
async function runMigrations() {
    console.log('🔄 Ejecutando migraciones automáticas de base de datos...');

    // 1. Agregar columna password a clientes (para el portal de clientes)
    try {
        await db.query("ALTER TABLE clientes ADD COLUMN password VARCHAR(255) NULL AFTER email;");
        console.log('✅ Columna [password] agregada a la tabla [clientes]');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna [password] ya existe en [clientes]');
        } else {
            console.error('❌ Error al agregar [password] a [clientes]:', e.message);
        }
    }

    // 2. Inicializar contraseñas por defecto (DNI) para clientes sin contraseña
    try {
        const [clientesSinPass] = await db.query('SELECT id, dni FROM clientes WHERE password IS NULL OR password = ""');
        if (clientesSinPass.length > 0) {
            console.log(`🔑 Inicializando contraseñas por defecto (DNI) para ${clientesSinPass.length} clientes...`);
            for (let cliente of clientesSinPass) {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(cliente.dni, salt);
                await db.query('UPDATE clientes SET password = ? WHERE id = ?', [hash, cliente.id]);
            }
            console.log('✅ Contraseñas inicializadas con éxito.');
        } else {
            console.log('ℹ️ Todos los clientes existentes ya cuentan con una contraseña.');
        }
    } catch (e) {
        console.error('❌ Error al inicializar contraseñas por defecto:', e.message);
    }

    // 3. Agregar columna ultimo_login a clientes
    try {
        await db.query("ALTER TABLE clientes ADD COLUMN ultimo_login DATETIME NULL DEFAULT NULL;");
        console.log('✅ Columna [ultimo_login] agregada a la tabla [clientes]');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna [ultimo_login] ya existe en [clientes]');
        } else {
            console.error('❌ Error al agregar [ultimo_login] a [clientes]:', e.message);
        }
    }

    // 4. Agregar columna app_instalada a clientes
    try {
        await db.query("ALTER TABLE clientes ADD COLUMN app_instalada TINYINT(1) DEFAULT 0;");
        console.log('✅ Columna [app_instalada] agregada a la tabla [clientes]');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna [app_instalada] ya existe en [clientes]');
        } else {
            console.error('❌ Error al agregar [app_instalada] a [clientes]:', e.message);
        }
    }

    // 5. Agregar columna cliente_id a push_subscriptions
    try {
        await db.query("ALTER TABLE push_subscriptions ADD COLUMN cliente_id INT NULL DEFAULT NULL;");
        console.log('✅ Columna [cliente_id] agregada a la tabla [push_subscriptions]');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna [cliente_id] ya existe en [push_subscriptions]');
        } else {
            console.error('❌ Error al agregar [cliente_id] a [push_subscriptions]:', e.message);
        }
    }


    // 7. Agregar columnas de configuración de notificaciones automáticas a la tabla configuracion
    try {
        await db.query("ALTER TABLE configuracion ADD COLUMN alerta_hora INT DEFAULT 8;");
        console.log('✅ Columna [alerta_hora] agregada a la tabla [configuracion]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [alerta_hora]:', e.message);
    }

    try {
        await db.query("ALTER TABLE configuracion ADD COLUMN push_texto_3d VARCHAR(255) DEFAULT 'Hola {{cliente}}, recuerda que tu cuota #{{numero}} de {{moneda}}{{monto}} vence en 3 días.';");
        console.log('✅ Columna [push_texto_3d] agregada a la tabla [configuracion]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [push_texto_3d]:', e.message);
    }

    try {
        await db.query("ALTER TABLE configuracion ADD COLUMN push_texto_1d VARCHAR(255) DEFAULT 'Hola {{cliente}}, mañana vence tu cuota #{{numero}} de {{moneda}}{{monto}}.';");
        console.log('✅ Columna [push_texto_1d] agregada a la tabla [configuracion]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [push_texto_1d]:', e.message);
    }

    try {
        await db.query("ALTER TABLE configuracion ADD COLUMN push_texto_0d VARCHAR(255) DEFAULT 'Hola {{cliente}}, hoy vence tu cuota #{{numero}} de {{moneda}}{{monto}}. Evita recargos.';");
        console.log('✅ Columna [push_texto_0d] agregada a la tabla [configuracion]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [push_texto_0d]:', e.message);
    }

    console.log('✅ Migraciones automáticas finalizadas.');
}

module.exports = { runMigrations };
