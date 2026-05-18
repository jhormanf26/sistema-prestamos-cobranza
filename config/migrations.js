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

    // 6. Actualizar plantilla prestamo_aprobado en la BD si no tiene las nuevas variables
    try {
        const [rows] = await db.query("SELECT variables_disponibles FROM plantillas_correo WHERE slug = 'prestamo_aprobado'");
        if (rows.length > 0 && !rows[0].variables_disponibles.includes('portal_url')) {
            console.log('🔄 Actualizando plantilla [prestamo_aprobado] en la base de datos con acceso al portal...');
            const nuevoHtml = `<div style="background-color: #6fbff047; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <tr>
            <td align="center" style="background: #1e3c72; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px 20px;">
                <div style="margin-bottom: 15px; font-size: 40px;">📩</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">¡Préstamo Aprobado!</h1>
                <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.8; font-size: 16px;">Tu solicitud ha sido procesada con éxito.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <p style="margin: 0 0 10px; font-size: 18px; color: #333;">Hola <strong>{{cliente}}</strong>,</p>
                <p style="margin: 0 0 30px; font-size: 15px; color: #666; line-height: 1.5;">Estamos encantados de informarte que tu solicitud de préstamo ha sido aprobada con éxito. A continuación los detalles principales:</p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 25px;">
                    <tr>
                        <td width="55" style="padding-bottom: 20px;">
                            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; width: 44px; height: 44px; text-align: center; line-height: 44px; font-size: 22px;">💰</div>
                        </td>
                        <td style="padding-bottom: 20px;">
                            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Monto Desembolsado</div>
                            <div style="color: #0f172a; font-size: 22px; font-weight: bold;">{{moneda}} {{monto}}</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="55" style="padding-bottom: 20px;">
                            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; width: 44px; height: 44px; text-align: center; line-height: 44px; font-size: 22px;">💳</div>
                        </td>
                        <td style="padding-bottom: 20px;">
                            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Total a Pagar</div>
                            <div style="color: #0f172a; font-size: 20px; font-weight: bold;">{{moneda}} {{total}}</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="55">
                            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; width: 44px; height: 44px; text-align: center; line-height: 44px; font-size: 22px;">📅</div>
                        </td>
                        <td>
                            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Número de Cuotas</div>
                            <div style="color: #0f172a; font-size: 20px; font-weight: bold;">{{cuotas}} fijas</div>
                        </td>
                    </tr>
                </table>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                    <tr>
                        <td style="padding: 25px;">
                            <h3 style="margin: 0 0 10px; color: #166534; font-size: 16px;">🌐 ¡Accede a tu Portal de Clientes!</h3>
                            <p style="margin: 0 0 20px; color: #1e3a1e; font-size: 14px; line-height: 1.5;">
                                Ahora puedes consultar el estado de tu crédito, ver tu cronograma de pagos, descargar tu contrato y activar recordatorios en la aplicación desde tu portal personal:
                            </p>
                            <div style="text-align: center; margin-bottom: 20px;">
                                <a href="https://prestamos.desarollo.site/portal-cliente/login" style="background: #166534; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">Ingresar al Portal</a>
                            </div>
                            <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #dcfce7; font-size: 13px; color: #14532d;">
                                🔑 <strong>Credenciales de acceso:</strong><br>
                                • <strong>Usuario:</strong> Tu número de documento ({{dni}})<br>
                                • <strong>Contraseña:</strong> Tu número de documento ({{dni}})
                            </div>
                        </td>
                    </tr>
                </table>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; background-color: #fffbeb; border-radius: 10px;">
                    <tr>
                        <td style="padding: 15px; border-left: 5px solid #f59e0b;">
                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.4;">
                                ℹ️ <strong>Documentos adjuntos en formato PDF</strong> para su revisión, control y firma.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 25px; background-color: #f9fafb; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                Sistema Financiero Profesional. <br>
                Este es un correo informativo, no responda a este mensaje.
            </td>
        </tr>
    </table>
</div>`;
            await db.query(`
                UPDATE plantillas_correo 
                SET variables_disponibles = 'cliente, monto, cuotas, total, moneda, dni, usuario, contrasena, portal_url',
                    html_content = ? 
                WHERE slug = 'prestamo_aprobado'
            `, [nuevoHtml]);
            console.log('✅ Base de Datos local actualizada: Plantilla [prestamo_aprobado] cuenta con portal de clientes.');
        }
    } catch (e) {
        console.error('❌ Error al actualizar plantilla prestamo_aprobado en la BD:', e.message);
    }
    
    console.log('✅ Migraciones automáticas finalizadas.');
}

module.exports = { runMigrations };
