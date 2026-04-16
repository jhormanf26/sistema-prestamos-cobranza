const express = require('express');
const router = express.Router();
const empenosController = require('../controllers/empenosController');
const protegerRuta = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// --- 1. CONFIGURACIÓN DE MULTER (Para subir imágenes) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Carpeta donde se guardarán las fotos (asegúrate de crear public/uploads)
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        // Nombre único para evitar reemplazar fotos con el mismo nombre
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.use(protegerRuta);

// --- 2. RUTAS ---

// Listar Empeños
router.get('/', empenosController.listar);

// Mostrar Formulario
router.get('/crear', empenosController.mostrarFormulario);

// GUARDAR (AQUÍ ESTABA EL PROBLEMA)
// Agregamos 'upload.single' para que Multer procese la imagen y el formulario
router.post('/guardar', upload.single('imagen'), empenosController.guardar);

// Liberar / Devolver Artículo
router.get('/liberar/:id', empenosController.devolver);

module.exports = router;