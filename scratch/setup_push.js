const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function setup() {
    try {
        console.log("Setting up Push Subscriptions Table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT DEFAULT NULL,
                endpoint TEXT NOT NULL,
                p256dh VARCHAR(255) NOT NULL,
                auth VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table created.");

        console.log("Generating VAPID Keys...");
        const envPath = path.join(__dirname, '../.env');
        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        
        if (!envContent.includes('VAPID_PUBLIC_KEY')) {
            const vapidKeys = webpush.generateVAPIDKeys();
            const append = `\n# Web Push VAPID Keys\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;
            fs.appendFileSync(envPath, append);
            console.log("Keys generated and saved to .env");
            console.log("Public Key: ", vapidKeys.publicKey);
        } else {
            console.log("VAPID Keys already exist in .env");
            // Extract public key to print
            const pubMatch = envContent.match(/VAPID_PUBLIC_KEY=(.*)/);
            if(pubMatch) console.log("Public Key: ", pubMatch[1]);
        }
        
        process.exit(0);
    } catch (e) {
        console.error("Error setting up push:", e);
        process.exit(1);
    }
}
setup();
