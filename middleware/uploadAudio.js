/**
 * @file uploadAudio.js
 * @description Middleware de Multer para la subida y validación segura de notas de voz (archivos de audio) en el chat de soporte.
 * @author Antigravity
 * @version 1.0.0
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta destino de audios
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
        // La API MediaRecorder del navegador a veces sube sin extensión o con mimetypes genéricos, aseguramos la extensión
        let ext = path.extname(file.originalname);
        if (!ext) {
            // Asignación por defecto en grabaciones crudas de navegador
            ext = file.mimetype.includes('webm') ? '.webm' : '.mp3';
        }
        cb(null, 'audio-' + uniqueSuffix + ext);
    }
});

// Filtro de validación para tipos de archivo de audio autorizados
const fileFilter = (req, file, cb) => {
    // Mimetypes permitidos de audio
    const allowedMimeTypes = [
        'audio/webm',
        'audio/mp3',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'audio/m4a',
        'audio/x-m4a',
        'audio/aac',
        'audio/3gpp',
        'application/octet-stream' // Aceptamos octet-stream por compatibilidad con uploads binarios desde grabadores de Safari/iOS
    ];

    const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
    
    // Extensiones permitidas
    const allowedExtensions = /webm|mp3|wav|ogg|m4a|aac|3gp|caf/;
    const isExtensionValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase()) || path.extname(file.originalname) === '';

    if (isMimeTypeValid || isExtensionValid) {
        return cb(null, true);
    }
    
    cb(new Error('Formato de audio no soportado. Se aceptan: webm, mp3, wav, ogg, m4a, aac.'));
};

const uploadAudio = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite máximo de 10 megabytes para notas de voz
    },
    fileFilter: fileFilter
});

module.exports = uploadAudio;
