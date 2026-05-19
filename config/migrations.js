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
    // 8. Nuevas tablas para Portal de Clientes, Loyalty y Chat
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS reportes_pago (
                id INT AUTO_INCREMENT PRIMARY KEY,
                prestamo_id INT NOT NULL,
                cliente_id INT NOT NULL,
                monto DECIMAL(15,2) NOT NULL,
                comprobante_url VARCHAR(255) NOT NULL,
                fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
                observaciones TEXT,
                fecha_validacion TIMESTAMP NULL,
                usuario_validador_id INT NULL,
                FOREIGN KEY (prestamo_id) REFERENCES prestamos(id) ON DELETE CASCADE,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_validador_id) REFERENCES usuarios(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Tabla [reportes_pago] verificada/creada');
    } catch (e) {
        console.error('❌ Error al crear tabla [reportes_pago]:', e.message);
    }

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS solicitudes_credito (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                monto_solicitado DECIMAL(15,2) NOT NULL,
                cuotas INT NOT NULL,
                frecuencia VARCHAR(50) DEFAULT 'mensual',
                estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
                fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_resolucion TIMESTAMP NULL,
                usuario_resolutor_id INT NULL,
                comentarios TEXT,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_resolutor_id) REFERENCES usuarios(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Tabla [solicitudes_credito] verificada/creada');
    } catch (e) {
        console.error('❌ Error al crear tabla [solicitudes_credito]:', e.message);
    }

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS soporte_mensajes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                usuario_id INT NULL,
                remitente ENUM('cliente', 'administrador') NOT NULL,
                mensaje TEXT NOT NULL,
                fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                leido TINYINT(1) DEFAULT 0,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Tabla [soporte_mensajes] verificada/creada');
    } catch (e) {
        console.error('❌ Error al crear tabla [soporte_mensajes]:', e.message);
    }

    // 9. Nuevos campos de configuración para canales de pago
    try {
        await db.query("ALTER TABLE configuracion ADD COLUMN nequi_numero VARCHAR(50) NULL DEFAULT '';");
        console.log('✅ Columna [nequi_numero] agregada a la tabla [configuracion]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [nequi_numero]:', e.message);
    }

    try {
        await db.query("ALTER TABLE configuracion ADD COLUMN breve_numero VARCHAR(50) NULL DEFAULT '';");
        console.log('✅ Columna [breve_numero] agregada a la tabla [configuracion]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [breve_numero]:', e.message);
    }

    // 10. Inserción de plantilla de pago rechazado si no existe
    try {
        const [rows] = await db.query('SELECT id FROM plantillas_correo WHERE slug = ?', ['pago_rechazado']);
        if (rows.length === 0) {
            await db.query(`
                INSERT INTO plantillas_correo (nombre, slug, asunto, descripcion, variables_disponibles, contenido_html)
                VALUES (
                    'Reporte de Pago Rechazado',
                    'pago_rechazado',
                    'Comprobante de Pago Rechazado',
                    'Se envía cuando la administración rechaza un comprobante de pago reportado por el cliente desde el portal.',
                    'cliente, monto, fecha, motivo, moneda',
                    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-top: 4px solid #dc3545;"><h2 style="color: #dc3545; text-align: center; margin-top: 0;">Comprobante de Pago Rechazado</h2><p style="color: #333333; font-size: 16px;">Hola <strong>{{cliente}}</strong>,</p><p style="color: #555555; line-height: 1.5;">Lamentamos informarte que el comprobante de pago que reportaste por el monto de <strong>{{moneda}}{{monto}}</strong> el día <strong>{{fecha}}</strong> ha sido rechazado tras la revisión de nuestro equipo administrativo.</p><div style="background-color: #fff3f3; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;"><h4 style="margin-top: 0; color: #dc3545;">Motivo del rechazo:</h4><p style="margin-bottom: 0; color: #333;"><em>{{motivo}}</em></p></div><p style="color: #555555; line-height: 1.5;">Te invitamos a ingresar al Portal del Cliente y subir un nuevo comprobante corregido, o a contactar a nuestro equipo de soporte técnico a través del chat interno para más detalles.</p><br><p style="color: #777777; font-size: 14px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px;">Este es un mensaje automático, por favor no respondas a este correo.</p></div></body></html>'
                )
            `);
            console.log('✅ Plantilla de correo [pago_rechazado] inyectada automáticamente');
        } else {
            console.log('ℹ️ La plantilla [pago_rechazado] ya existe en la base de datos.');
        }
    } catch (e) {
        console.error('❌ Error al inyectar plantilla de pago rechazado:', e.message);
    }
    // 11. Tablas para aportes y retiros de ahorro desde el portal cliente
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS reportes_aporte_ahorro (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cuenta_id INT NOT NULL,
                cliente_id INT NOT NULL,
                monto DECIMAL(15,2) NOT NULL,
                comprobante_url VARCHAR(255) NOT NULL,
                fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
                observaciones TEXT,
                fecha_validacion TIMESTAMP NULL,
                usuario_validador_id INT NULL,
                FOREIGN KEY (cuenta_id) REFERENCES cuentas_ahorro(id) ON DELETE CASCADE,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_validador_id) REFERENCES usuarios(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Tabla [reportes_aporte_ahorro] verificada/creada');
    } catch (e) {
        console.error('❌ Error al crear tabla [reportes_aporte_ahorro]:', e.message);
    }

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS solicitudes_retiro_ahorro (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cuenta_id INT NOT NULL,
                cliente_id INT NOT NULL,
                monto_solicitado DECIMAL(15,2) NOT NULL,
                estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
                fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_resolucion TIMESTAMP NULL,
                usuario_resolutor_id INT NULL,
                comentarios TEXT,
                FOREIGN KEY (cuenta_id) REFERENCES cuentas_ahorro(id) ON DELETE CASCADE,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_resolutor_id) REFERENCES usuarios(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Tabla [solicitudes_retiro_ahorro] verificada/creada');
    } catch (e) {
        console.error('❌ Error al crear tabla [solicitudes_retiro_ahorro]:', e.message);
    }

    console.log('✅ Migraciones automáticas finalizadas.');
}

module.exports = { runMigrations };
