const PlantillaModel = require('../models/PlantillaModel');

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
        const { asunto, html_content } = req.body;
        try {
            await PlantillaModel.actualizar(id, { asunto, html_content });
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
    }
};

module.exports = plantillasController;
