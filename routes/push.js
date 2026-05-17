const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Endpoint para obtener la clave pública
router.get('/public-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Guardar suscripción
router.post('/subscribe', async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Suscripción inválida' });
        }
        
        const { endpoint, keys } = subscription;
        const usuario_id = req.session.usuario ? req.session.usuario.id : null;
        
        // Verifica si ya existe en la BD
        const [exists] = await db.query("SELECT id FROM push_subscriptions WHERE endpoint = ?", [endpoint]);
        if (exists.length === 0) {
            await db.query("INSERT INTO push_subscriptions (usuario_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)", 
            [usuario_id, endpoint, keys.p256dh, keys.auth]);
        }
        res.status(201).json({ success: true });
    } catch (e) {
        console.error("Error al guardar suscripción push:", e);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
