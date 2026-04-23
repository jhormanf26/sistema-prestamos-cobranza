const PlantillaPdfModel = require('../models/PlantillaPdfModel');

const plantillasPdfController = {

    listar: async (req, res) => {
        try {
            const plantillas = await PlantillaPdfModel.obtenerTodas();
            res.render('plantillas_pdf/index', {
                title: 'Plantillas de Documentos PDF',
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
            const plantilla = await PlantillaPdfModel.obtenerPorSlug(slug);
            if (!plantilla) return res.redirect('/plantillas-pdf');

            res.render('plantillas_pdf/editar', {
                title: `Editar PDF: ${plantilla.nombre}`,
                plantilla
            });
        } catch (error) {
            console.error(error);
            res.redirect('/plantillas-pdf');
        }
    },

    actualizar: async (req, res) => {
        const { id } = req.params;
        const { contenido } = req.body;
        try {
            await PlantillaPdfModel.actualizar(id, { contenido });
            req.flash('mensajeExito', 'Plantilla PDF actualizada correctamente');
            res.redirect('/plantillas-pdf');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar la plantilla PDF');
            res.redirect('/plantillas-pdf');
        }
    }
};

module.exports = plantillasPdfController;
