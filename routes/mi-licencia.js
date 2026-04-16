const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JSON_PATH = path.join(__dirname, '../config/licencia.json');
const JWT_SECRET = 'Kj$8LmpP@qZ1xV#9RtW&3Nf*cYuTbE^2oSvA!';

// Middleware de autenticación local
function isLoggedIn(req, res, next) {
    if (req.session && req.session.usuario) return next();
    res.redirect('/auth/login');
}

router.get('/', isLoggedIn, (req, res) => {
    let licenciaInfo = {
        estado: 'Sin Licencia',
        estadoClase: 'bloqueada',
        diasRestantes: 0,
        fechaVencimiento: null,
        fechaEmision: null,
        ruc: 'N/A',
        empresaId: 'N/A',
        tipo: 'N/A',
        tokenActual: '',
        porcentajeVigencia: 0
    };

    try {
        const fileData = fs.readFileSync(JSON_PATH, 'utf-8');
        const config = JSON.parse(fileData);

        if (config.token) {
            // Decodificamos sin verificar para mostrar datos incluso si está vencida
            const decoded = jwt.decode(config.token);

            if (decoded) {
                licenciaInfo.ruc = decoded.ruc || 'N/A';
                licenciaInfo.empresaId = decoded.empresa_id || 'N/A';
                licenciaInfo.tipo = decoded.tipo || 'N/A';
                licenciaInfo.tokenActual = config.token;

                // Calcular fechas
                if (decoded.iat) {
                    licenciaInfo.fechaEmision = new Date(decoded.iat * 1000).toLocaleDateString('es-PE');
                }

                if (decoded.exp) {
                    const ahora = new Date();
                    const vence = new Date(decoded.exp * 1000);
                    const emitido = new Date(decoded.iat * 1000);

                    licenciaInfo.fechaVencimiento = vence.toLocaleDateString('es-PE');

                    const msRestantes = vence - ahora;
                    licenciaInfo.diasRestantes = Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60 * 24)));

                    // Vigencia en porcentaje para la barra de progreso
                    const totalDias = Math.ceil((vence - emitido) / (1000 * 60 * 60 * 24));
                    licenciaInfo.porcentajeVigencia = totalDias > 0
                        ? Math.min(100, Math.round((licenciaInfo.diasRestantes / totalDias) * 100))
                        : 0;

                    // Estado según días restantes
                    if (msRestantes <= 0) {
                        licenciaInfo.estado = 'Expirada';
                        licenciaInfo.estadoClase = 'expirada';
                    } else if (licenciaInfo.diasRestantes <= 7) {
                        licenciaInfo.estado = 'Por Vencer';
                        licenciaInfo.estadoClase = 'por-vencer';
                    } else {
                        licenciaInfo.estado = 'Activa';
                        licenciaInfo.estadoClase = 'activa';
                    }
                } else {
                    // Sin exp = Perpetua
                    licenciaInfo.estado = 'Activa';
                    licenciaInfo.estadoClase = 'activa';
                    licenciaInfo.fechaVencimiento = 'Perpetua';
                    licenciaInfo.diasRestantes = '∞';
                    licenciaInfo.porcentajeVigencia = 100;
                }
            }
        }
    } catch (e) {
        console.error('Error leyendo licencia:', e.message);
    }

    res.render('mi-licencia', { licenciaInfo, usuario: req.session.usuario });
});

router.post('/renovar', isLoggedIn, (req, res) => {
    const nuevoToken = (req.body.token_licencia || '').trim();

    if (!nuevoToken) {
        req.flash('mensajeError', 'El token no puede estar vacío.');
        return res.redirect('/mi-licencia');
    }

    jwt.verify(nuevoToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            const msg = err.name === 'TokenExpiredError'
                ? 'El token ya está vencido, solicite uno nuevo.'
                : 'Token inválido o corrupto. Verifique la clave.';
            req.flash('mensajeError', msg);
            return res.redirect('/mi-licencia');
        }

        try {
            fs.writeFileSync(JSON_PATH, JSON.stringify({ token: nuevoToken }), 'utf-8');
            req.flash('mensajeExito', '✅ Licencia renovada y activada correctamente.');
            res.redirect('/mi-licencia');
        } catch (e) {
            req.flash('mensajeError', 'Error al guardar la licencia en disco.');
            res.redirect('/mi-licencia');
        }
    });
});

module.exports = router;
