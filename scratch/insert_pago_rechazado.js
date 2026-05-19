/**
 * @file insert_pago_rechazado.js
 * @description Script de migración local para registrar la plantilla de correo de "Comprobante de Pago Rechazado"
 * en la base de datos (tabla plantillas_correo). Permite que el administrador pueda editarla desde la interfaz web.
 * @author Antigravity
 * @version 1.0.0
 */

const db = require('../config/db');

/**
 * Inserta de manera segura la plantilla de correo para el rechazo de pagos.
 * Si ya existe una plantilla con el slug 'pago_rechazado', evita duplicarla.
 * 
 * @async
 * @function registrarPlantillaRechazo
 * @returns {Promise<void>} Promesa que se resuelve al finalizar el proceso de migración.
 * @throws {Error} Excepción si ocurre un fallo en la conexión o ejecución de la consulta.
 */
async function registrarPlantillaRechazo() {
    console.log('🚀 Iniciando registro de la plantilla de correo [pago_rechazado]...');
    
    // HTML Premium con el diseño rojo elegante tipo SweetAlert2/Bootstrap
    const htmlContent = `<div style="background-color: #fef2f2; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 15px; overflow: hidden; border: 1px solid #fee2e2; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <tr>
            <td align="center" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px;">
                <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: bold;">Comprobante Rechazado</h1>
                <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.8;">Tu reporte de pago requiere corrección.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px; text-align: left;">
                <p style="margin: 0 0 20px; color: #333; font-size: 16px;">Hola <strong>{{cliente}}</strong>,</p>
                <p style="margin: 0 0 20px; color: #475569; font-size: 15px; line-height: 1.6;">
                    Te informamos que tu reporte de pago por <strong>{{moneda}} {{monto}}</strong> enviado el <strong>{{fecha}}</strong> no pudo ser aprobado por nuestra administración.
                </p>
                
                <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 15px; border-radius: 6px; margin: 25px 0;">
                    <strong style="color: #be123c; display: block; margin-bottom: 5px;">⚠️ Motivo del rechazo:</strong>
                    <span style="color: #9f1239; font-style: italic;">"{{motivo}}"</span>
                </div>
                
                <p style="margin: 0 0 25px; color: #475569; font-size: 15px; line-height: 1.6;">
                    Por favor, ingresa a tu portal de clientes para verificar la información y volver a subir tu comprobante de pago si fue un error al adjuntar la imagen o al ingresar los datos del reporte.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://prestamos.desarollo.site/portal-cliente/login" style="background: #dc2626; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">Ir al Portal del Cliente</a>
                </div>
                
                <p style="font-size: 13px; color: #64748b; margin-top: 30px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    Si tienes alguna duda o consideras que se trata de un error, puedes ponerte en contacto con soporte técnico de inmediato a través del <strong>chat interno de tu portal de cliente</strong>.
                </p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 20px; background-color: #f9fafb; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
                © Sistema de Cobranza Profesional.
            </td>
        </tr>
    </table>
</div>`;

    try {
        // Verificar si la plantilla ya existe para no duplicarla
        const [rows] = await db.query('SELECT id FROM plantillas_correo WHERE slug = ?', ['pago_rechazado']);
        
        if (rows.length > 0) {
            console.log('ℹ️ La plantilla [pago_rechazado] ya se encuentra registrada en la base de datos.');
            
            // Si ya existe, podemos actualizarla opcionalmente o avisar. Vamos a dejarla intacta
            // para no sobrescribir posibles ediciones que el administrador haya hecho, pero informamos.
            console.log('✅ Proceso de migración omitido (ya existe la plantilla).');
        } else {
            // Si no existe, procedemos a realizar la inserción completa
            const query = `
                INSERT INTO plantillas_correo 
                (nombre, slug, asunto, descripcion, variables_disponibles, html_content) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            await db.query(query, [
                'Reporte de Pago Rechazado',
                'pago_rechazado',
                'Comprobante de Pago Rechazado',
                'Se envía cuando la administración rechaza un comprobante de pago reportado por el cliente desde el portal.',
                'cliente, monto, fecha, motivo, moneda',
                htmlContent
            ]);
            
            console.log('✅ ¡La plantilla [pago_rechazado] ha sido registrada exitosamente en la base de datos!');
        }
    } catch (error) {
        console.error('❌ Error registrando la plantilla en la base de datos:', error);
        throw error;
    } finally {
        // Cerrar la conexión pool para que el proceso de Node.js finalice limpiamente
        await db.end();
    }
}

// Ejecutar migración
registrarPlantillaRechazo().catch(() => {
    process.exit(1);
});
