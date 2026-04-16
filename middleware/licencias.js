const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// La misma llave secreta usada en el panel generador
const JWT_SECRET = 'Kj$8LmpP@qZ1xV#9RtW&3Nf*cYuTbE^2oSvA!';
const JSON_PATH = path.join(__dirname, '../config/licencia.json');

// URL del Panel de Licencias para registrar activaciones
const PANEL_URL = process.env.PANEL_LICENCIAS_URL || 'http://localhost:4000';

// Evitar reportar en cada request — solo una vez por arranque
let activacionReportada = false;

function reportarActivacion(token) {
    if (activacionReportada) return;
    activacionReportada = true;

    try {
        const body = JSON.stringify({ token, servidor: require('os').hostname() });
        const urlObj = new URL(`${PANEL_URL}/api/activacion`);
        const lib = urlObj.protocol === 'https:' ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            timeout: 3000
        };

        const req = lib.request(options, (res) => {
            console.log(`[Licencia] Activación reportada al panel (${res.statusCode})`);
        });

        req.on('error', (e) => {
            // Silenciamos el error — el sistema funciona sin conexión al panel
            console.log('[Licencia] Panel offline, activación no reportada (modo offline OK).');
        });

        req.on('timeout', () => {
            req.destroy();
        });

        req.write(body);
        req.end();
    } catch(e) {
        // No interrumpir el sistema si falla el reporte
    }
}

const verificarLicencia = (req, res, next) => {
    // Rutas que no requieren licencia válida
    const url = req.originalUrl;
    if (url.startsWith('/licencia-web') || url.startsWith('/public') || url.startsWith('/css') || url.startsWith('/js') || url.startsWith('/uploads')) {
        return next();
    }

    try {
        let fileData = fs.readFileSync(JSON_PATH, 'utf-8');
        let config = JSON.parse(fileData);

        if (!config.token || config.token.trim() === '') {
            return res.redirect('/licencia-web/bloqueado'); // No hay licencia
        }

        // Verificar criptográficamente y revisar expiración (exp)
        jwt.verify(config.token, JWT_SECRET, (err, decoded) => {
            if (err) {
                let mensaje = err.name === 'TokenExpiredError'
                    ? 'SU LICENCIA HA EXPIRADO'
                    : 'LICENCIA INVÁLIDA O CORRUPTA';

                req.flash('error_licencia', mensaje);
                return res.redirect('/licencia-web/bloqueado');
            }

            // Licencia Válida — reportar activación al panel (async, no bloquea)
            reportarActivacion(config.token);

            res.locals.datos_licencia = decoded;
            next();
        });
    } catch (error) {
        console.error('Error leyendo config/licencia.json:', error);
        res.redirect('/licencia-web/bloqueado');
    }
};

module.exports = verificarLicencia;
