const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que la carpeta destino exista
const dir = 'public/uploads/documentos/';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

/**
 * Configuración de almacenamiento de Multer para documentos.
 * Los archivos se guardarán en public/uploads/documentos/ con un nombre único basado en timestamps.
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const unico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + unico + path.extname(file.originalname).toLowerCase());
    }
});

/**
 * Filtro de archivos para restringir los formatos permitidos.
 * Solo se permiten archivos PDF e imágenes (PNG, JPG, JPEG).
 * 
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} file - Archivo procesado por Multer.
 * @param {Function} cb - Callback de Multer para indicar éxito o fallo.
 */
const fileFilter = (req, file, cb) => {
    const filetypes = /pdf|jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Formato no permitido. Solo se aceptan archivos PDF, JPG, JPEG o PNG.'));
};

/**
 * Instancia configurada de Multer para la subida de documentos.
 * Límite de tamaño: 10 megabytes.
 */
const uploadDocumento = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

module.exports = uploadDocumento;
