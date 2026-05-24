const express = require('express');
const router = express.Router();
const clienteDocumentosController = require('../controllers/clienteDocumentosController');
const uploadDocumento = require('../middleware/uploadDocumento');
const protegerRuta = require('../middleware/auth');

// Todas las rutas en este archivo requieren autenticación administrativa/de empleado
router.use(protegerRuta);

/**
 * Ruta para la subida de un documento desde el panel administrativo.
 * Recibe el archivo bajo la clave 'documento'.
 */
router.post('/subir/:clienteId', uploadDocumento.single('documento'), clienteDocumentosController.subirDocumentoAdmin);

/**
 * Ruta para actualizar el estado (Aprobado/Rechazado) de un documento.
 */
router.post('/estado/:id', clienteDocumentosController.actualizarEstado);

/**
 * Ruta para eliminar un documento de forma lógica y del disco físico.
 */
router.delete('/eliminar/:id', clienteDocumentosController.eliminar);

module.exports = router;
