const db = require('../config/db');

async function insertTemplate() {
    const html = `
<div style="background-color: #fefce8; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <tr>
            <td align="center" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">Recordatorio de Pago</h1>
                <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">Estamos aquí para ayudarte a mantenerte al día.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 35px;">
                <p style="margin: 0 0 20px; font-size: 18px; color: #1e293b;">Hola <strong>{{cliente}}</strong>,</p>
                <p style="margin: 0 0 30px; font-size: 16px; color: #475569; line-height: 1.6;">Te escribimos para recordarte que tienes una cuota próxima a vencer. Mantener tus pagos al día te permite seguir disfrutando de nuestros beneficios financieros.</p>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0;">
                    <tr>
                        <td style="padding-bottom: 15px;">
                            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Monto de la Cuota</div>
                            <div style="color: #0f172a; font-size: 24px; font-weight: 800;">{{moneda}} {{monto}}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 15px; border-top: 1px solid #e2e8f0;">
                            <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Fecha de Vencimiento</div>
                            <div style="color: #dc2626; font-size: 20px; font-weight: 700;">{{fecha}}</div>
                        </td>
                    </tr>
                </table>

                <div style="margin-top: 35px; padding: 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                        <strong>Nota:</strong> Si ya realizaste el pago, por favor ignora este mensaje. Si tienes dudas, contáctanos respondiendo a este correo.
                    </p>
                </div>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">© Sistema de Gestión de Préstamos Pro</p>
                <p style="margin: 5px 0 0; color: #cbd5e1; font-size: 11px;">Este es un mensaje automático de recordatorio.</p>
            </td>
        </tr>
    </table>
</div>
    `;

    try {
        await db.query(`
            INSERT INTO plantillas_correo (nombre, slug, asunto, descripcion, variables_disponibles, html_content)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE html_content = VALUES(html_content)
        `, [
            'Recordatorio de Pago',
            'recordatorio_pago',
            '⚠️ Recordatorio: Tu cuota vence pronto',
            'Se envía manualmente para recordar el vencimiento de una cuota',
            'cliente, monto, fecha, moneda',
            html
        ]);
        console.log('✅ Plantilla de recordatorio insertada/actualizada.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    }
}

insertTemplate();
