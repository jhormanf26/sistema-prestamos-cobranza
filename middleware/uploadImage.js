/**
 * @file uploadImage.js
 * @description Middleware de Multer para la subida y validación segura de imágenes en el chat de soporte técnico.
 * @author Antigravity
 * @version 1.0.0
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta destino de imágenes (la misma del chat de soporte)
const uploadDir = 'public/uploads/soporte/';

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
        cb(null, 'imagen-' + uniqueSuffix + (ext || '.png'));
    }
});

// Filtro de validación para tipos de imágenes autorizadas
const fileFilter = (req, file, cb) => {
    // Mimetypes permitidos de imagen
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ];

    const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
    
    // Extensiones permitidas
    const allowedExtensions = /jpeg|jpg|png|webp|gif/;
    const isExtensionValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

    if (isMimeTypeValid && isExtensionValid) {
        return cb(null, true);
    }
    
    cb(new Error('Formato de imagen no soportado. Se aceptan: jpg, jpeg, png, webp, gif.'));
};

const uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite máximo de 10 megabytes por imagen
    },
    fileFilter: fileFilter
});

module.exports = uploadImage;
