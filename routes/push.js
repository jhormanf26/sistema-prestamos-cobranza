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
        const { subscription, deviceInfo } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Suscripción inválida' });
        }
        
        const { endpoint, keys } = subscription;
        const usuario_id = req.session.usuario ? req.session.usuario.id : null;
        const cliente_id = req.session.cliente ? req.session.cliente.id : null;
        
        // Verifica si ya existe en la BD
        const [exists] = await db.query("SELECT id FROM push_subscriptions WHERE endpoint = ?", [endpoint]);
        if (exists.length === 0) {
            await db.query("INSERT INTO push_subscriptions (usuario_id, cliente_id, endpoint, p256dh, auth, device_info) VALUES (?, ?, ?, ?, ?, ?)", 
            [usuario_id, cliente_id, endpoint, keys.p256dh, keys.auth, JSON.stringify(deviceInfo || {})]);
        } else {
            // Si ya existe, actualizamos la info del dispositivo por si acaso
            await db.query("UPDATE push_subscriptions SET device_info = ?, usuario_id = IFNULL(usuario_id, ?), cliente_id = IFNULL(cliente_id, ?) WHERE endpoint = ?", 
            [JSON.stringify(deviceInfo || {}), usuario_id, cliente_id, endpoint]);
        }
        res.status(201).json({ success: true });
    } catch (e) {
        console.error("Error al guardar suscripción push:", e);
        res.status(500).json({ success: false });
    }
});

// Actualizar información silenciosamente (batería, conexión, etc.) sin volver a pedir permiso
router.post('/update-info', async (req, res) => {
    try {
        const { endpoint, deviceInfo } = req.body;
        if (!endpoint || !deviceInfo) {
            return res.status(400).json({ error: 'Faltan datos' });
        }
        
        await db.query("UPDATE push_subscriptions SET device_info = ?, ultima_conexion = CURRENT_TIMESTAMP WHERE endpoint = ?", [JSON.stringify(deviceInfo), endpoint]);
        res.json({ success: true });
    } catch (e) {
        console.error("Error al actualizar info del dispositivo:", e);
        res.status(500).json({ success: false });
    }
});

// Asignar un nombre amigable al dispositivo
router.post('/update-name', async (req, res) => {
    try {
        const { id, nombre } = req.body;
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        
        await db.query("UPDATE push_subscriptions SET nombre_dispositivo = ? WHERE id = ?", [nombre, id]);
        res.json({ success: true });
    } catch (e) {
        console.error("Error al actualizar nombre del dispositivo:", e);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
