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

// 2. Mostrar dispositivos
router.get('/dispositivos', async (req, res) => {
    try {
        const db = require('../config/db');
        const [dispositivos] = await db.query(`
            SELECT p.id, p.endpoint, p.device_info, p.nombre_dispositivo, p.created_at, p.ultima_conexion, u.nombre_completo 
            FROM push_subscriptions p 
            LEFT JOIN usuarios u ON p.usuario_id = u.id 
            ORDER BY p.ultima_conexion DESC
        `);
        res.render('config/dispositivos', {
            title: 'Dispositivos Registrados',
            dispositivos,
            usuario: req.session.usuario
        });
    } catch (e) {
        console.error(e);
        res.redirect('/config');
    }
});

// 3. Mostrar formulario (GET /config/)
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

        const modulos_activos = {
            clientes: req.body.mod_clientes === 'on',
            prestamos: req.body.mod_prestamos === 'on',
            simulador: req.body.mod_simulador === 'on',
            gastos: req.body.mod_gastos === 'on',
            reportes: req.body.mod_reportes === 'on',
            empenos: req.body.mod_empenos === 'on',
            ahorros: req.body.mod_ahorros === 'on',
            cadenas: req.body.mod_cadenas === 'on',
            promocion: req.body.mod_promocion === 'on'
        };

        const datos = {
            nombre_empresa,
            ruc,
            direccion,
            telefono,
            moneda: moneda || 'S/',
            interes_global: parseFloat(interes_global) || 0,
            logo: logoNombre,
            email_contacto,
            modulos_activos: JSON.stringify(modulos_activos)
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
