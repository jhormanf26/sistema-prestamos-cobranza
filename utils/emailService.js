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
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, datos[key]);
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
    plantillaPrestamo: async (cliente, monto, cuotas, total, moneda) => {
        const fallback = `
            <div style="background-color: #f4f7f9; padding: 20px; font-family: Arial;">
                <table align="center" width="100%" style="max-width: 600px; background: #fff; border-radius: 15px;">
                    <tr><td align="center" style="background: #1e3c72; padding: 30px; color: #fff;"><h1>¡Préstamo Aprobado!</h1></td></tr>
                    <tr><td style="padding: 30px;">Hola ${cliente}, tu préstamo de ${moneda} ${formatCurrency(monto, 2)} ha sido aprobado.</td></tr>
                </table>
            </div>
        `;
        const res = await renderizar('prestamo_aprobado', {
            cliente, 
            monto: formatCurrency(monto, 2), 
            cuotas, 
            total: formatCurrency(total, 2), 
            moneda
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
    }
};

module.exports = emailService;
