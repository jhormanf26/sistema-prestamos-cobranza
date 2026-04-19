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

// Configuración de frecuencia de verificación (Default: 1 hora)
const INTERVALO = parseInt(process.env.LICENCIA_INTERVALO_MS) || 3600000;
let ultimaVerificacionMs = 0;
let estadoLicenciaRemota = 'ok'; // 'ok' o 'bloqueado'

function reportarActivacion(token) {
    const ahora = Date.now();
    
    // Verificamos según el intervalo configurado (y solo si el estado actual es OK)
    if (ahora - ultimaVerificacionMs < INTERVALO && estadoLicenciaRemota === 'ok') return;

    ultimaVerificacionMs = ahora;

    try {
        const body = JSON.stringify({ token, servidor: require('os').hostname() });

        // Logs de depuración solicitados
        console.log('--- [LICENCIA DEBUG] ---');
        console.log(`Última Verificación (MS): ${ultimaVerificacionMs}`);
        console.log(`Estado Licencia Remota: ${estadoLicenciaRemota}`);
        console.log(`Body enviado: ${body}`);
        console.log(`URL Destino: ${PANEL_URL}/api/activacion`);
        console.log('-------------------------');

        const urlObj = new URL(`${PANEL_URL}/api/activacion`);
        const lib = urlObj.protocol === 'https:' ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            timeout: 5000,
            rejectUnauthorized: false // Permite conexiones aunque haya temas de certificados/proxy
        };

        const req = lib.request(options, (res) => {
            console.log(`[Licencia] Verificación con panel: ${res.statusCode}`);

            // Si el panel explícitamente dice que no está autorizada (pausa, cancelación, etc)
            if (res.statusCode === 403 || res.statusCode === 401 || res.statusCode === 423) {
                console.warn('[Licencia] ATENCIÓN: El panel ha reportado licencia NO VÁLIDA.');
                estadoLicenciaRemota = 'bloqueado';
            } else if (res.statusCode === 200) {
                estadoLicenciaRemota = 'ok';
            }
        });

        req.on('error', (e) => {
            // Imprimimos el error técnico para saber por qué falla (DNS, SSL, Red, etc)
            console.error(`[Licencia] Detalles del error: ${e.message} (Código: ${e.code})`);
            console.log('[Licencia] Panel offline, validación remota pospuesta (modo offline OK).');
        });

        req.on('timeout', () => {
            req.destroy();
        });

        req.write(body);
        req.end();
    } catch (e) {
        // No interrumpir el sistema si falla el reporte
    }
}

const verificarLicencia = (req, res, next) => {
    // Rutas que no requieren licencia válida
    const url = req.originalUrl;
    if (url.startsWith('/licencia-web') || url.startsWith('/public') || url.startsWith('/css') || url.startsWith('/js') || url.startsWith('/uploads')) {
        return next();
    }

    // Verificar si el panel marcó la licencia como bloqueada en la última comprobación
    if (estadoLicenciaRemota === 'bloqueado') {
        req.flash('error_licencia', 'SU LICENCIA HA SIDO SUSPENDIDA O PAUSADA');
        return res.redirect('/licencia-web/bloqueado');
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

            // Licencia Válida localmente — proceder a verificar/reportar al panel (async)
            reportarActivacion(config.token);

            res.locals.datos_licencia = decoded;
            next();
        });
    } catch (error) {
        console.error('Error leyendo config/licencia.json:', error);
        res.redirect('/licencia-web/bloqueado');
    }
};

module.exports = {
    verificarLicencia,
    forzarRevalidacion: () => {
        estadoLicenciaRemota = 'ok';
        ultimaVerificacionMs = 0;
    }
};
