/**
 * @file uploadDesembolso.js
 * @description Middleware de Multer para la subida y validación segura de comprobantes de desembolso de préstamos.
 * @author Antigravity
 * @version 1.0.0
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta destino de comprobantes de desembolso
const uploadDir = 'public/uploads/desembolsos/';

// Asegurar la existencia física del directorio para evitar excepciones en disco
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración del motor de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar un nombre de archivo único para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'desembolso-' + uniqueSuffix + (ext || '.png'));
    }
});

// Filtro de validación para tipos de imágenes autorizadas
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ];

    const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
    const allowedExtensions = /jpeg|jpg|png|webp|gif/;
    const isExtensionValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

    if (isMimeTypeValid && isExtensionValid) {
        return cb(null, true);
    }
    
    cb(new Error('Formato de comprobante no soportado. Se aceptan: jpg, jpeg, png, webp, gif.'));
};

const uploadDesembolso = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite máximo de 10 megabytes por archivo
    },
    fileFilter: fileFilter
});

module.exports = uploadDesembolso;
