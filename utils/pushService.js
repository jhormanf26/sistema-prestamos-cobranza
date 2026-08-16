const webpush = require('web-push');
const db = require('../config/db');

// Se asume que las variables de entorno ya están cargadas por app.js
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            'mailto:contacto@sistema.com',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    } catch (err) {
        console.warn("Advertencia: No se pudieron configurar las llaves VAPID:", err.message);
    }
}

async function sendPushToAdmins(payload) {
    if (!process.env.VAPID_PUBLIC_KEY) return;
    
    try {
        const [subs] = await db.query("SELECT * FROM push_subscriptions WHERE usuario_id IS NOT NULL");
        for (const sub of subs) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            try {
                await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
            } catch (e) {
                // 410 or 404 means the subscription has expired or is no longer valid
                if (e.statusCode === 410 || e.statusCode === 404) {
                    await db.query("DELETE FROM push_subscriptions WHERE id = ?", [sub.id]);
                } else {
                    console.error("Error enviando push a", sub.endpoint, e);
                }
            }
        }
    } catch (e) {
        console.error("Error en sendPushToAdmins:", e);
    }
}

async function sendPushToUser(clienteId, payload) {
    if (!process.env.VAPID_PUBLIC_KEY) return;
    
    try {
        const [subs] = await db.query("SELECT * FROM push_subscriptions WHERE cliente_id = ?", [clienteId]);
        for (const sub of subs) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            try {
                await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
            } catch (e) {
                if (e.statusCode === 410 || e.statusCode === 404) {
                    await db.query("DELETE FROM push_subscriptions WHERE id = ?", [sub.id]);
                } else {
                    console.error("Error enviando push a cliente", clienteId, sub.endpoint, e);
                }
            }
        }
    } catch (e) {
        console.error("Error en sendPushToUser:", e);
    }
}

module.exports = { sendPushToAdmins, sendPushToUser };
