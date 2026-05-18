const PlantillaModel = require('../models/PlantillaModel');
const ConfigModel = require('../models/ConfigModel');
const emailService = require('../utils/emailService');
const pdfService = require('../utils/pdfService');

const plantillasController = {

    listar: async (req, res) => {
        try {
            const plantillas = await PlantillaModel.obtenerTodas();
            res.render('plantillas/index', {
                title: 'Plantillas de Correo',
                plantillas
            });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    editar: async (req, res) => {
        const { slug } = req.params;
        try {
            const plantilla = await PlantillaModel.obtenerPorSlug(slug);
            if (!plantilla) return res.redirect('/plantillas');

            res.render('plantillas/editar', {
                title: `Editar: ${plantilla.nombre}`,
                plantilla
            });
        } catch (error) {
            console.error(error);
            res.redirect('/plantillas');
        }
    },

    actualizar: async (req, res) => {
        const { id } = req.params;
        const { asunto, html_content, enviar_pdf, pdfs } = req.body;
        
        // Estructurar adjuntos_config
        const adjuntos_config = {
            enviar_pdf: enviar_pdf === 'on',
            pdfs: Array.isArray(pdfs) ? pdfs : (pdfs ? [pdfs] : [])
        };

        try {
            await PlantillaModel.actualizar(id, { asunto, html_content, adjuntos_config });
            req.flash('mensajeExito', 'Plantilla actualizada correctamente');
            res.redirect('/plantillas');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar la plantilla');
            res.redirect('/plantillas');
        }
    },

    previsualizar: async (req, res) => {
        const { slug } = req.params;
        try {
            const plantilla = await PlantillaModel.obtenerPorSlug(slug);
            if (!plantilla) return res.send('Plantilla no encontrada');
            
            // Simular previsualización (podríamos reemplazar variables con datos dummy aquí)
            let html = plantilla.html_content;
            res.send(html);
        } catch (error) {
            res.send('Error al generar previsualización');
        }
    },

    previsualizarPDF: async (req, res) => {
        const { tipo } = req.params;
        try {
            const buffer = await pdfService.generarEjemploBuffer(tipo);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(buffer);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al generar la vista previa del PDF');
        }
    },

    enviarPrueba: async (req, res) => {
        const { slug } = req.params;
        const { email } = req.body;

        try {
            const config = await ConfigModel.obtener();
            const moneda = config ? config.moneda : '$';
            const telefono = config ? config.telefono : '573100000000';

            let result;

            switch (slug) {
                case 'prestamo_aprobado':
                    result = await emailService.plantillaPrestamo('Cliente de Prueba', 1000000, 12, 1200000, moneda, '12345678');
                    break;
                case 'pago_recibido':
                    result = await emailService.plantillaPago('Cliente de Prueba', 100000, new Date(), 900000, moneda);
                    break;
                case 'ahorro_deposito':
                    result = await emailService.plantillaAhorro('Cliente de Prueba', 'deposito', 50000, 550000, moneda);
                    break;
                case 'ahorro_retiro':
                    result = await emailService.plantillaAhorro('Cliente de Prueba', 'retiro', 20000, 530000, moneda);
                    break;
                case 'recordatorio_pago':
                    result = await emailService.plantillaRecordatorio('Cliente de Prueba', 100000, new Date(), moneda);
                    break;
                case 'recordatorio_cadena':
                    result = await emailService.plantillaCadena('Cliente de Prueba', 50000, 'Ahorro Navidad', 5, moneda);
                    break;
                case 'prestamo_preaprobado':
                    result = await emailService.plantillaPreaprobado('Cliente de Prueba', 5000000, moneda, telefono);
                    break;
                default:
                    return res.json({ success: false, mensaje: 'Plantilla no reconocida para pruebas.' });
            }

            if (result && result.html) {
                await emailService.enviarCorreo(email, `[PRUEBA] ${result.asunto || 'Test de Plantilla'}`, result.html);
                return res.json({ success: true });
            } else {
                return res.json({ success: false, mensaje: 'No se pudo generar el contenido de la plantilla.' });
            }

        } catch (error) {
            console.error(error);
            res.json({ success: false, mensaje: 'Error al enviar el correo de prueba.' });
        }
    }
};

module.exports = plantillasController;
