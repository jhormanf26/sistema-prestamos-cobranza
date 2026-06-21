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
                tipo ENUM('texto', 'audio', 'imagen') DEFAULT 'texto',
                fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_entregado TIMESTAMP NULL DEFAULT NULL,
                fecha_visto TIMESTAMP NULL DEFAULT NULL,
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
                INSERT INTO plantillas_correo (nombre, slug, asunto, descripcion, variables_disponibles, html_content)
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
    // 12. Agregar columnas fecha_entregado y fecha_visto a soporte_mensajes para bases de datos existentes
    try {
        await db.query("ALTER TABLE soporte_mensajes ADD COLUMN fecha_entregado TIMESTAMP NULL DEFAULT NULL AFTER fecha_envio;");
        console.log('✅ Columna [fecha_entregado] agregada a la tabla [soporte_mensajes]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [fecha_entregado]:', e.message);
    }

    try {
        await db.query("ALTER TABLE soporte_mensajes ADD COLUMN fecha_visto TIMESTAMP NULL DEFAULT NULL AFTER fecha_entregado;");
        console.log('✅ Columna [fecha_visto] agregada a la tabla [soporte_mensajes]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [fecha_visto]:', e.message);
    }

    try {
        await db.query("ALTER TABLE soporte_mensajes ADD COLUMN tipo ENUM('texto', 'audio', 'imagen') DEFAULT 'texto' AFTER mensaje;");
        console.log('✅ Columna [tipo] agregada a la tabla [soporte_mensajes]');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            // Si la columna ya existe, la modificamos para asegurarnos de que acepte el ENUM completo con 'imagen'
            try {
                await db.query("ALTER TABLE soporte_mensajes MODIFY COLUMN tipo ENUM('texto', 'audio', 'imagen') DEFAULT 'texto';");
                console.log('✅ Columna [tipo] en [soporte_mensajes] actualizada a ENUM(texto, audio, imagen)');
            } catch (modifyErr) {
                console.error('❌ Error al modificar columna [tipo] en [soporte_mensajes]:', modifyErr.message);
            }
        } else {
            console.error('❌ Error al agregar [tipo]:', e.message);
        }
    }

    // 13. Columnas para contratos digitales (Firma)
    try {
        await db.query("ALTER TABLE prestamos ADD COLUMN firma_digital LONGTEXT NULL AFTER estado;");
        console.log('✅ Columna [firma_digital] agregada a la tabla [prestamos]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [firma_digital]:', e.message);
    }

    try {
        await db.query("ALTER TABLE prestamos ADD COLUMN fecha_firma DATETIME NULL AFTER firma_digital;");
        console.log('✅ Columna [fecha_firma] agregada a la tabla [prestamos]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [fecha_firma]:', e.message);
    }

    try {
        await db.query("ALTER TABLE prestamos ADD COLUMN ip_firma VARCHAR(50) NULL AFTER fecha_firma;");
        console.log('✅ Columna [ip_firma] agregada a la tabla [prestamos]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [ip_firma]:', e.message);
    }

    try {
        await db.query("ALTER TABLE prestamos ADD COLUMN firma_otp VARCHAR(10) NULL AFTER ip_firma;");
        console.log('✅ Columna [firma_otp] agregada a la tabla [prestamos]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [firma_otp]:', e.message);
    }

    // 14. Tabla para documentos de clientes (genérica)
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS clientes_documentos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                nombre_documento VARCHAR(100) NOT NULL,
                archivo_url VARCHAR(255) NOT NULL,
                subido_por ENUM('cliente', 'administrador') DEFAULT 'cliente',
                estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
                motivo_rechazo TEXT NULL,
                fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Tabla [clientes_documentos] verificada/creada');
    } catch (e) {
        console.error('❌ Error al crear tabla [clientes_documentos]:', e.message);
    }

    // 15. Inserción de plantillas para documentos de clientes si no existen
    try {
        // Plantilla: documento_cargado
        const [docCargado] = await db.query('SELECT id FROM plantillas_correo WHERE slug = ?', ['documento_cargado']);
        if (docCargado.length === 0) {
            await db.query(`
                INSERT INTO plantillas_correo (nombre, slug, asunto, descripcion, variables_disponibles, html_content)
                VALUES (
                    'Notificación de Documento Cargado',
                    'documento_cargado',
                    '[Sistema] Nuevo documento subido por {{cliente}}',
                    'Se envía al administrador cuando un cliente sube un documento desde el portal.',
                    'cliente, dni, documento, fecha',
                    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #1e3c72;"><h2 style="color: #1e3c72; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">Nuevo Documento Recibido</h2><p style="color: #333333; font-size: 16px;">El cliente <strong>{{cliente}}</strong> (CC/DNI: <strong>{{dni}}</strong>) ha subido un nuevo documento a la plataforma.</p><div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;"><ul style="margin: 0; padding-left: 20px; color: #334155; line-height: 1.6;"><li><strong>Nombre del Documento:</strong> {{documento}}</li><li><strong>Fecha de Carga:</strong> {{fecha}}</li><li><strong>Canal de Carga:</strong> Portal de Clientes</li></ul></div><p style="color: #555555; line-height: 1.5;">Por favor, ingresa al panel de administración para auditar y validar el archivo.</p><br><p style="color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px; margin-bottom: 0;">Este es un mensaje automático del Sistema de Préstamos.</p></div></body></html>'
                )
            `);
            console.log('✅ Plantilla [documento_cargado] inyectada automáticamente');
        }

        // Plantilla: documento_aprobado
        const [docAprobado] = await db.query('SELECT id FROM plantillas_correo WHERE slug = ?', ['documento_aprobado']);
        if (docAprobado.length === 0) {
            await db.query(`
                INSERT INTO plantillas_correo (nombre, slug, asunto, descripcion, variables_disponibles, html_content)
                VALUES (
                    'Documento Aprobado',
                    'documento_aprobado',
                    '¡Excelente! Tu documento ha sido aprobado',
                    'Se envía al cliente cuando la administración aprueba un documento.',
                    'cliente, documento, portal_url',
                    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #15803d;"><h2 style="color: #15803d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">✅ Documento Aprobado</h2><p style="color: #333333; font-size: 16px;">Hola <strong>{{cliente}}</strong>,</p><p style="color: #555555; line-height: 1.5;">Tu documento ha sido revisado y verificado correctamente por nuestro equipo:</p><div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #15803d;"><ul style="margin: 0; padding-left: 20px; color: #334155; line-height: 1.6;"><li><strong>Documento:</strong> {{documento}}</li><li><strong>Estado:</strong> APROBADO</li></ul></div><p style="color: #555555; line-height: 1.5;">El archivo ya forma parte de tu expediente digital. No es necesario realizar acciones adicionales.</p><p style="text-align: center; margin-top: 25px;"><a href="{{portal_url}}" style="background: #15803d; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Ingresar al Portal</a></p><br><p style="color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px; margin-bottom: 0;">Este es un mensaje automático del Sistema de Préstamos.</p></div></body></html>'
                )
            `);
            console.log('✅ Plantilla [documento_aprobado] inyectada automáticamente');
        }

        // Plantilla: documento_rechazado
        const [docRechazado] = await db.query('SELECT id FROM plantillas_correo WHERE slug = ?', ['documento_rechazado']);
        if (docRechazado.length === 0) {
            await db.query(`
                INSERT INTO plantillas_correo (nombre, slug, asunto, descripcion, variables_disponibles, html_content)
                VALUES (
                    'Documento Rechazado',
                    'documento_rechazado',
                    'Atención: Tu documento ha sido rechazado',
                    'Se envía al cliente cuando la administración rechaza un documento indicando el motivo.',
                    'cliente, documento, motivo, portal_url',
                    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #dc2626;"><h2 style="color: #dc2626; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">❌ Documento Rechazado</h2><p style="color: #333333; font-size: 16px;">Hola <strong>{{cliente}}</strong>,</p><p style="color: #555555; line-height: 1.5;">Lamentamos informarte que tu documento no pudo ser aprobado por nuestro equipo de validación:</p><div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;"><ul style="margin: 0; padding-left: 20px; color: #334155; line-height: 1.6;"><li><strong>Documento:</strong> {{documento}}</li><li><strong>Estado:</strong> RECHAZADO</li></ul></div><div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 15px; border-radius: 6px; margin: 20px 0;"><strong style="color: #be123c; display: block; margin-bottom: 5px;">Motivo del Rechazo:</strong><span style="color: #9f1239; font-style: italic;">"{{motivo}}"</span></div><p style="color: #555555; line-height: 1.5;">Te solicitamos ingresar a tu Portal de Clientes, eliminar este archivo y volver a cargar tu documento corregido.</p><p style="text-align: center; margin-top: 25px;"><a href="{{portal_url}}" style="background: #dc2626; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Ingresar al Portal</a></p><br><p style="color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px; margin-bottom: 0;">Este es un mensaje automático del Sistema de Préstamos.</p></div></body></html>'
                )
            `);
            console.log('✅ Plantilla [documento_rechazado] inyectada automáticamente');
        }
    } catch (e) {
        console.error('❌ Error al inyectar plantillas de documentos:', e.message);
    }

    // 16. Tabla para códigos de verificación OTP (Firma y Retiro de Ahorros)
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS codigos_otp (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT NOT NULL,
                codigo_hash VARCHAR(255) NOT NULL,
                accion VARCHAR(50) NOT NULL COMMENT 'firma_contrato o retiro_ahorro',
                referencia_id INT DEFAULT NULL COMMENT 'ID del Préstamo o Cuenta Ahorro',
                intentos INT DEFAULT 0 COMMENT 'Para control de fuerza bruta (máx 3)',
                expiracion DATETIME NOT NULL,
                estado ENUM('pendiente', 'usado', 'bloqueado') DEFAULT 'pendiente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Tabla [codigos_otp] verificada/creada');
    } catch (e) {
        console.error('❌ Error al crear tabla [codigos_otp]:', e.message);
    }

    // 17. Inserción de plantilla de correo para OTP
    try {
        const [rows] = await db.query('SELECT id FROM plantillas_correo WHERE slug = ?', ['codigo_otp']);
        if (rows.length === 0) {
            await db.query(`
                INSERT INTO plantillas_correo (nombre, slug, asunto, descripcion, variables_disponibles, html_content)
                VALUES (
                    'Código de Seguridad OTP',
                    'codigo_otp',
                    'Código de Verificación OTP - {{cliente}}',
                    'Se envía al cliente para verificar operaciones críticas como firmar contratos y solicitar retiros de ahorro.',
                    'cliente, codigo, accion, minutos',
                    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;"><div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #10b981;"><h2 style="color: #0f172a; text-align: center; margin-top: 0;">Código de Verificación</h2><p style="color: #475569; font-size: 16px; text-align: center; margin-bottom: 25px;">Hola <strong>{{cliente}}</strong>, usa el siguiente código de seguridad de un solo uso para autorizar tu operación de <strong>{{accion}}</strong>:</p><div style="text-align: center;"><div style="background-color: #f1f5f9; border-radius: 8px; padding: 15px 30px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; font-family: monospace;">{{codigo}}</div></div><p style="font-size: 13px; color: #94a3b8; margin-top: 25px; text-align: center;">Este código es de un solo uso y expirará en <strong>{{minutos}} minutos</strong>. Si no solicitaste este código, por favor ignora este mensaje.</p><br><p style="color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px; margin-bottom: 0;">Este es un mensaje automático del Sistema de Préstamos.</p></div></body></html>'
                )
            `);
            console.log('✅ Plantilla [codigo_otp] inyectada automáticamente');
        } else {
            console.log('ℹ️ La plantilla [codigo_otp] ya existe en la base de datos.');
        }
    } catch (e) {
        console.error('❌ Error al inyectar plantilla de código OTP:', e.message);
    }

    // 18. Agregar columnas score y score_fecha a clientes para Scoring Crediticio
    try {
        await db.query("ALTER TABLE clientes ADD COLUMN score INT DEFAULT 500 AFTER monto_preaprobado;");
        console.log('✅ Columna [score] agregada a la tabla [clientes]');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna [score] ya existe en [clientes]');
        } else {
            console.error('❌ Error al agregar [score] a [clientes]:', e.message);
        }
    }

    try {
        await db.query("ALTER TABLE clientes ADD COLUMN score_fecha DATETIME NULL DEFAULT NULL AFTER score;");
        console.log('✅ Columna [score_fecha] agregada a la tabla [clientes]');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ La columna [score_fecha] ya existe en [clientes]');
        } else {
            console.error('❌ Error al agregar [score_fecha] a [clientes]:', e.message);
        }
    }

    // 19. Columnas para comprobante y notas de desembolso en prestamos
    try {
        await db.query("ALTER TABLE prestamos ADD COLUMN comprobante_desembolso VARCHAR(255) NULL AFTER observaciones;");
        console.log('✅ Columna [comprobante_desembolso] agregada a la tabla [prestamos]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [comprobante_desembolso]:', e.message);
    }

    try {
        await db.query("ALTER TABLE prestamos ADD COLUMN notas_desembolso TEXT NULL AFTER comprobante_desembolso;");
        console.log('✅ Columna [notas_desembolso] agregada a la tabla [prestamos]');
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.error('❌ Error al agregar [notas_desembolso]:', e.message);
    }

    // 20. Inserción de plantilla de PDF para Paz y Salvo si no existe
    try {
        const [rows] = await db.query("SELECT id FROM plantillas_pdf WHERE slug = ?", ['paz_y_salvo']);
        if (rows.length === 0) {
            await db.query(`
                INSERT INTO plantillas_pdf (nombre, slug, contenido, descripcion)
                VALUES (
                    'Certificado de Paz y Salvo',
                    'paz_y_salvo',
                    'CERTIFICADO DE PAZ Y SALVO\\r\\n\\r\\nPor medio del presente documento, {{empresa}} con RUC/NIT {{ruc}}, certifica que el deudor {{cliente}} identificado con documento de identidad Nro. {{dni}}, a la fecha se encuentra a PAZ Y SALVO con nuestra organización por concepto del crédito de libre inversión Nro. {{prestamo_id}}, el cual fue desembolsado por un valor de {{moneda}} {{monto}} el día {{fecha_inicio}} y liquidado totalmente.\\r\\n\\r\\nPor consiguiente, se declara que no existe obligación pendiente, saldo en mora ni reclamación alguna que formular por concepto de dicho préstamo.\\r\\n\\r\\nDado en la ciudad de oficina principal a los {{fecha_pazysalvo}}.',
                    'Cuerpo principal del certificado de Paz y Salvo para créditos liquidados'
                )
            `);
            console.log('✅ Plantilla de PDF [paz_y_salvo] inyectada automáticamente');
        } else {
            console.log('ℹ️ La plantilla de PDF [paz_y_salvo] ya existe en la base de datos.');
        }
    } catch (e) {
        console.error('❌ Error al inyectar plantilla de PDF de Paz y Salvo:', e.message);
    }

    console.log('✅ Migraciones automáticas finalizadas.');
}

module.exports = { runMigrations };
