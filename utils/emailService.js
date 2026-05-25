const nodemailer = require('nodemailer');
require('dotenv').config();
const { formatCurrency } = require('./formatters');
const PlantillaModel = require('../models/PlantillaModel');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Función auxiliar para renderizar plantillas dinámicas desde la BD
 * o usar una local si no existe en la BD.
 */
async function renderizar(slug, datos, fallbackHtml) {
    try {
        const plantilla = await PlantillaModel.obtenerPorSlug(slug);
        let html = (plantilla && plantilla.html_content) ? plantilla.html_content : fallbackHtml;
        
        // Reemplazar variables {{variable}}
        Object.keys(datos).forEach(key => {
            // Soporta {{variable}} y {{ variable }}
            // Escapamos las llaves \{ \{ para mayor seguridad en el motor de Regex
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            html = html.replace(regex, () => datos[key]);
        });
        
        return {
            asunto: (plantilla && plantilla.asunto) ? plantilla.asunto : null,
            html,
            adjuntos_config: (plantilla && plantilla.adjuntos_config) ? plantilla.adjuntos_config : null
        };
    } catch (e) {
        return { asunto: null, html: fallbackHtml, adjuntos_config: null };
    }
}

const emailService = {

    enviarCorreo: async (destinatario, asunto, contenidoHTML, adjuntos = []) => {
        if (!destinatario) return;
        try {
            await transporter.sendMail({
                from: `"Sistema Financiero" <${process.env.EMAIL_USER}>`,
                to: destinatario,
                subject: asunto,
                html: contenidoHTML,
                attachments: adjuntos
            });
            console.log(`Correo enviado a ${destinatario} con ${adjuntos.length} adjuntos`);
        } catch (error) {
            console.error('Error enviando correo:', error.message);
        }
    },

    // Convertidas a ASYNC para leer de la base de datos
    plantillaPrestamo: async (cliente, monto, cuotas, total, moneda, dni = '') => {
        const fallback = `
            <div style="background-color: #f4f7f9; padding: 20px; font-family: Arial;">
                <table align="center" width="100%" style="max-width: 600px; background: #fff; border-radius: 15px;">
                    <tr><td align="center" style="background: #1e3c72; padding: 30px; color: #fff;"><h1>¡Préstamo Aprobado!</h1></td></tr>
                    <tr><td style="padding: 30px;">
                        <p>Hola ${cliente}, tu préstamo de ${moneda} ${formatCurrency(monto, 2)} ha sido aprobado.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p><strong>🌐 ¡Accede a tu Portal de Clientes!</strong></p>
                        <p>Ahora puedes consultar el cronograma de tus cuotas, tu contrato y registrar el pago de tus cuotas desde nuestra plataforma web:</p>
                        <p align="center" style="margin: 25px 0;">
                            <a href="https://prestamos.desarollo.site/portal-cliente/login" style="background: #005bff; color: #fff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ingresar al Portal</a>
                        </p>
                        <p style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 14px; border: 1px solid #e2e8f0; color: #334155;">
                            🔑 <strong>Credenciales de acceso por defecto:</strong><br>
                            • <strong>Usuario:</strong> Tu número de documento (${dni || 'DNI'})<br>
                            • <strong>Contraseña:</strong> Tu número de documento (${dni || 'DNI'})
                        </p>
                    </td></tr>
                </table>
            </div>
        `;
        const res = await renderizar('prestamo_aprobado', {
            cliente, 
            monto: formatCurrency(monto, 2), 
            cuotas, 
            total: formatCurrency(total, 2), 
            moneda,
            dni,
            usuario: dni,
            contrasena: dni,
            portal_url: 'https://prestamos.desarollo.site/portal-cliente/login'
        }, fallback);
        return res; // Retorna {asunto, html}
    },

    plantillaPago: async (cliente, monto, fecha, saldoPendiente, moneda) => {
        const fallback = `
            <div style="background-color: #f0fdf4; padding: 20px; font-family: Arial;">
                <table align="center" width="100%" style="max-width: 600px; background: #fff; border-radius: 15px;">
                    <tr><td align="center" style="background: #15803d; padding: 30px; color: #fff;"><h1>Pago Recibido</h1></td></tr>
                    <tr><td style="padding: 30px;">Hola ${cliente}, recibimos tu pago por ${moneda} ${formatCurrency(monto, 2)}.</td></tr>
                </table>
            </div>
        `;
        const res = await renderizar('pago_recibido', {
            cliente, 
            monto: formatCurrency(monto, 2), 
            fecha: new Date(fecha).toLocaleDateString(), 
            saldoPendiente: formatCurrency(saldoPendiente, 2), 
            moneda
        }, fallback);
        return res;
    },

    plantillaAhorro: async (cliente, tipo, monto, nuevoSaldo, moneda) => {
        const slug = tipo === 'deposito' ? 'ahorro_deposito' : 'ahorro_retiro';
        const fallback = `<div>Movimiento de ahorro de ${moneda} ${formatCurrency(monto, 2)} procesado.</div>`;
        const res = await renderizar(slug, {
            cliente, 
            tipo, 
            monto: formatCurrency(monto, 2), 
            nuevoSaldo: formatCurrency(nuevoSaldo, 2), 
            moneda
        }, fallback);
        return res;
    },

    plantillaRecordatorio: async (cliente, total, fechaFin, moneda) => {
        const fallback = `
            <div style="background-color: #fffbeb; padding: 20px; font-family: Arial;">
                <table align="center" width="100%" style="max-width: 600px; background: #fff; border-radius: 15px;">
                    <tr><td align="center" style="background: #f59e0b; padding: 30px; color: #fff;"><h1>Recordatorio de Pago</h1></td></tr>
                    <tr><td style="padding: 30px;">Hola ${cliente}, te recordamos que tienes un pago pendiente por ${moneda} ${formatCurrency(total, 2)} que vence el ${new Date(fechaFin).toLocaleDateString()}.</td></tr>
                </table>
            </div>
        `;
        const res = await renderizar('recordatorio_pago', {
            cliente,
            monto: formatCurrency(total, 2),
            fecha: new Date(fechaFin).toLocaleDateString(),
            moneda
        }, fallback);
        return res;
    },

    plantillaCadena: async (cliente, monto, cadenaNombre, ciclo, moneda) => {
        const fallback = `
            <div style="background-color: #f0f9ff; padding: 20px; font-family: Arial;">
                <table align="center" width="100%" style="max-width: 600px; background: #fff; border-radius: 15px;">
                    <tr><td align="center" style="background: #0284c7; padding: 30px; color: #fff;"><h1>Recordatorio de Ahorro</h1></td></tr>
                    <tr><td style="padding: 30px;">Hola ${cliente}, recuerda tu aporte de ${moneda} ${formatCurrency(monto, 2)} para la cadena ${cadenaNombre} (Ciclo ${ciclo}).</td></tr>
                </table>
            </div>
        `;
        const res = await renderizar('recordatorio_cadena', {
            cliente,
            monto: formatCurrency(monto, 2),
            cadena: cadenaNombre,
            ciclo,
            moneda
        }, fallback);
        return res;
    },

    plantillaPreaprobado: async (cliente, monto, moneda, telefonoEmpresa) => {
        const montoFormateado = `${moneda} ${formatCurrency(monto, 2)}`;
        const textoMsg = encodeURIComponent(`Hola, estoy interesado en el crédito pre-aprobado por valor de ${montoFormateado}`);
        
        let telefonoLimpio = (telefonoEmpresa || '').replace(/\D/g, '');
        // Si el teléfono tiene 10 dígitos (común en Colombia) y no empieza por 57, se lo agregamos
        if (telefonoLimpio.length === 10 && !telefonoLimpio.startsWith('57')) {
            telefonoLimpio = '57' + telefonoLimpio;
        }

        const linkWhatsapp = telefonoLimpio ? `https://wa.me/${telefonoLimpio}?text=${textoMsg}` : '#';
        
        const fallback = `
            <div style="background-color: #f8fafc; padding: 20px; font-family: Arial;">
                <table align="center" width="100%" style="max-width: 600px; background: #fff; border-radius: 15px;">
                    <tr><td align="center" style="background: #3b82f6; padding: 30px; color: #fff;"><h1>¡Crédito Pre-aprobado!</h1></td></tr>
                    <tr><td style="padding: 30px;">Hola ${cliente}, tienes un crédito pre-aprobado por ${moneda} ${formatCurrency(monto, 2)}.</td></tr>
                    <tr><td align="center" style="padding: 20px;"><a href="${linkWhatsapp}" style="background: #25d366; color: #fff; padding: 15px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">¡LO QUIERO YA!</a></td></tr>
                </table>
            </div>
        `;
        const res = await renderizar('prestamo_preaprobado', {
            cliente,
            monto: formatCurrency(monto, 2),
            moneda,
            link_whatsapp: linkWhatsapp
        }, fallback);
        return res;
    },

    plantillaRechazoPago: async (cliente, monto, fecha, motivo, moneda) => {
        const fallback = `
            <div style="background-color: #fef2f2; padding: 20px; font-family: Arial;">
                <table align="center" width="100%" style="max-width: 600px; background: #fff; border-radius: 15px; overflow: hidden; border: 1px solid #fee2e2; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <tr><td align="center" style="background: #dc2626; padding: 30px; color: #fff;"><h1>Comprobante de Pago Rechazado</h1></td></tr>
                    <tr><td style="padding: 30px; color: #1f2937; font-size: 16px; line-height: 1.5;">
                        <p>Hola <strong>${cliente}</strong>,</p>
                        <p>Te informamos que tu reporte de pago por <strong>${moneda} ${formatCurrency(monto, 2)}</strong> enviado el <strong>${new Date(fecha).toLocaleDateString()}</strong> no pudo ser aprobado por nuestra administración.</p>
                        <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <strong style="color: #be123c; display: block; margin-bottom: 5px;">⚠️ Motivo del rechazo:</strong>
                            <span style="color: #9f1239; font-style: italic;">"${motivo}"</span>
                        </div>
                        <p>Por favor, ingresa a tu portal de clientes para verificar la información y volver a subir tu comprobante de pago si fue un error al adjuntar la imagen o al ingresar los datos.</p>
                        <p align="center" style="margin: 25px 0;">
                            <a href="https://prestamos.desarollo.site/portal-cliente/login" style="background: #dc2626; color: #fff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Ir al Portal del Cliente</a>
                        </p>
                        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Si tienes dudas sobre este rechazo, puedes ponerte en contacto con soporte técnico a través del chat interno de tu portal.</p>
                    </td></tr>
                </table>
            </div>
        `;
        const res = await renderizar('pago_rechazado', {
            cliente, 
            monto: formatCurrency(monto, 2), 
            fecha: new Date(fecha).toLocaleDateString(), 
            motivo,
            moneda
        }, fallback);
        return res;
    },

    plantillaDocumentoCargado: async (cliente, dni, documento, fecha) => {
        const fallback = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
                <h2 style="color: #1e3c72; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">Nuevo Documento Recibido</h2>
                <p>El cliente <strong>${cliente}</strong> (CC/DNI: <strong>${dni}</strong>) ha subido un nuevo documento a la plataforma.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <ul style="margin: 0; padding-left: 20px; color: #334155;">
                        <li><strong>Nombre del Documento:</strong> ${documento}</li>
                        <li><strong>Fecha de Carga:</strong> ${fecha}</li>
                        <li><strong>Canal de Carga:</strong> Portal de Clientes</li>
                    </ul>
                </div>
                <p style="margin-top: 25px;">Por favor, ingresa al panel de administración para auditar y validar el archivo.</p>
            </div>
        `;
        const res = await renderizar('documento_cargado', {
            cliente,
            dni,
            documento,
            fecha
        }, fallback);
        return res;
    },

    plantillaDocumentoAprobado: async (cliente, documento) => {
        const portalUrl = 'https://prestamos.desarollo.site/portal-cliente/login';
        const fallback = `
            <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #1e293b;">
                <table align="center" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #15803d;">
                    <tr>
                        <td align="center" style="background: #15803d; padding: 30px 20px; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Documento Aprobado</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 25px;">
                            <p>Hola <strong>${cliente}</strong>,</p>
                            <p>Tu documento ha sido aprobado correctamente por nuestro equipo:</p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <tr>
                                    <td><strong>Documento:</strong></td>
                                    <td>${documento}</td>
                                </tr>
                                <tr>
                                    <td><strong>Estado:</strong></td>
                                    <td style="color: #15803d; font-weight: bold;">APROBADO</td>
                                </tr>
                            </table>
                            <p align="center" style="margin-top: 30px;">
                                <a href="${portalUrl}" style="background: #15803d; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ingresar al Portal</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        `;
        const res = await renderizar('documento_aprobado', {
            cliente,
            documento,
            portal_url: portalUrl
        }, fallback);
        return res;
    },

    plantillaDocumentoRechazado: async (cliente, documento, motivo) => {
        const portalUrl = 'https://prestamos.desarollo.site/portal-cliente/login';
        const fallback = `
            <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #1e293b;">
                <table align="center" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #dc2626;">
                    <tr>
                        <td align="center" style="background: #dc2626; padding: 30px 20px; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Documento Rechazado</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 25px;">
                            <p>Hola <strong>${cliente}</strong>,</p>
                            <p>Tu documento ha sido rechazado tras la revisión:</p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <tr>
                                    <td><strong>Documento:</strong></td>
                                    <td>${documento}</td>
                                </tr>
                                <tr>
                                    <td><strong>Estado:</strong></td>
                                    <td style="color: #dc2626; font-weight: bold;">RECHAZADO</td>
                                </tr>
                            </table>
                            <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 15px; border-radius: 4px; margin: 20px 0;">
                                <strong style="color: #be123c;">Motivo:</strong> ${motivo || 'No especificado'}
                            </div>
                            <p align="center" style="margin-top: 30px;">
                                <a href="${portalUrl}" style="background: #dc2626; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ingresar al Portal</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        `;
        const res = await renderizar('documento_rechazado', {
            cliente,
            documento,
            motivo: motivo || 'No especificado por el administrador',
            portal_url: portalUrl
        }, fallback);
        return res;
    },

    plantillaOtp: async (cliente, codigo, accion, minutos = 5) => {
        const fallback = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #10b981;">
                <div style="background-color: #0f172a; padding: 25px; text-align: center; color: white;">
                    <h2 style="margin: 0; font-size: 20px;">Código de Verificación</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff; text-align: center;">
                    <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">Hola <strong>${cliente}</strong>, usa el siguiente código de seguridad de un solo uso para autorizar tu operación de <strong>${accion}</strong>:</p>
                    <div style="background-color: #f1f5f9; border-radius: 8px; padding: 15px 30px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; font-family: monospace;">${codigo}</div>
                    <p style="font-size: 13px; color: #94a3b8; margin-top: 25px;">Este código es de un solo uso y expirará en <strong>${minutos} minutos</strong>. Si no solicitaste este código, por favor ignora este mensaje.</p>
                </div>
            </div>
        `;
        const res = await renderizar('codigo_otp', {
            cliente,
            codigo,
            accion,
            minutos
        }, fallback);
        return res;
    }
};

module.exports = emailService;
