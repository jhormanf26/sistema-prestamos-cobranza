const PlantillaModel = require('../models/PlantillaModel');
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
    }
};

module.exports = plantillasController;
