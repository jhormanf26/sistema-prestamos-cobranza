const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
// Asegúrate que este middleware exista en tu proyecto, si no, usa multer directo
const upload = require('../middleware/upload'); 
const protegerRuta = require('../middleware/auth'); // Opcional si usas protección

// Listar
router.get('/', clientesController.listar);

// Crear
router.get('/crear', clientesController.mostrarFormulario);
router.post('/guardar', upload.single('foto'), clientesController.guardar);

// Ver Perfil
router.get('/ver/:id', clientesController.verPerfil);

// Editar
router.get('/editar/:id', clientesController.mostrarEdicion);
router.post('/actualizar/:id', upload.single('foto'), clientesController.actualizar);

// (NUEVO) Cambiar Estado
router.get('/cambiar-estado/:id', clientesController.cambiarEstado);

module.exports = router;