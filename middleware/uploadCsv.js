const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar existencia de la carpeta de uploads temporal
const uploadDir = path.join(__dirname, '../public/uploads/csv');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const unico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'csv-' + unico + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (ext === '.csv' || mime.includes('csv') || mime.includes('text') || mime.includes('excel')) {
        return cb(null, true);
    }
    cb(new Error('Error: El archivo cargado debe ser un archivo CSV válido (.csv)'));
};

const uploadCsv = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
    fileFilter: fileFilter
});

module.exports = uploadCsv;
