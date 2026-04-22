const express = require('express');
const router = express.Router();
const ConfigModel = require('../models/ConfigModel');
const protegerRuta = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// 1. Configuración de Multer (Para subir el Logo)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Carpeta de destino
    },
    filename: function (req, file, cb) {
        // Nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.use(protegerRuta);

// 2. Mostrar formulario (GET /config/)
router.get('/', async (req, res) => {
    try {
        const config = await ConfigModel.obtener();
        res.render('config/index', { 
            title: 'Configuración',
            config: config || {},
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error(error);
        req.flash('mensajeError', 'Error al cargar la configuración.');
        res.redirect('/');
    }
});

// 3. Procesar cambios (POST /config/actualizar)
// "logo" debe coincidir con el name="logo" de tu input en el HTML
router.post('/actualizar', upload.single('logo'), async (req, res) => {
    try {
        const { nombre_empresa, ruc, direccion, telefono, moneda, interes_global , email_contacto} = req.body;
        
        // Si subió foto, capturamos el nombre. Si no, es null.
        const logoNombre = req.file ? req.file.filename : null;

        const datos = {
            nombre_empresa,
            ruc,
            direccion,
            telefono,
            moneda: moneda || 'S/',
            interes_global: parseFloat(interes_global) || 0,
            logo: logoNombre,
            email_contacto
        };

        // Guardar en BD
        await ConfigModel.guardar(datos);
        
        // Actualizar variable global para ver el cambio al instante
        if (req.app.locals.empresa) {
            req.app.locals.empresa = { ...req.app.locals.empresa, ...datos };
            // Si no subió logo nuevo, mantenemos el anterior en la visualización
            if (!logoNombre) delete datos.logo; 
            else req.app.locals.empresa.logo = logoNombre;
        }

        req.flash('mensajeExito', 'Configuración guardada correctamente.');
        res.redirect('/config'); // Redirige a la misma página

    } catch (error) {
        console.error("Error al actualizar config:", error);
        req.flash('mensajeError', 'Error interno al guardar (Verifique base de datos).');
        res.redirect('/config');
    }
});

module.exports = router;
