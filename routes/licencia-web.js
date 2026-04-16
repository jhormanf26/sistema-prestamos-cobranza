const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JSON_PATH = path.join(__dirname, '../config/licencia.json');
const JWT_SECRET = 'Kj$8LmpP@qZ1xV#9RtW&3Nf*cYuTbE^2oSvA!';

router.get('/bloqueado', (req, res) => {
    // Si ya tiene licencia vigente, redirigimos al login/home
    try {
        let fileData = fs.readFileSync(JSON_PATH, 'utf-8');
        let config = JSON.parse(fileData);
        if (config.token) {
            jwt.verify(config.token, JWT_SECRET, (err, decoded) => {
                if (!err) {
                    return res.redirect('/'); // Licencia activa, se salta el bloqueo
                }
            });
        }
    } catch(e) {}

    let msj = req.flash('error_licencia');
    res.render('licencia-bloqueada', { error_licencia: msj.length > 0 ? msj[0] : null });
});

router.post('/validar-token', (req, res) => {
    const nuevoToken = req.body.token_licencia;

    if (!nuevoToken) {
        req.flash('error_licencia', 'El token está vacío');
        return res.redirect('/licencia-web/bloqueado');
    }

    // Verificar criptográficamente si sirve
    jwt.verify(nuevoToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            req.flash('error_licencia', 'TOKEN INVÁLIDO O INCOMPLETO');
            return res.redirect('/licencia-web/bloqueado');
        }

        // Si pasó la verificación, lo guardamos en el JSON local del sistema
        try {
            fs.writeFileSync(JSON_PATH, JSON.stringify({ token: nuevoToken }), 'utf-8');
            console.log('✅ Novedad: Licencia Activada para cliente: ', decoded.cliente);
            res.redirect('/'); // Mandar al login/portada
        } catch(e) {
            req.flash('error_licencia', 'Error físico al guardar licencia en disco');
            res.redirect('/licencia-web/bloqueado');
        }
    });

});

module.exports = router;
