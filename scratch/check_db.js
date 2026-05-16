const db = require('../config/db');
async function check() {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM web_analytics");
        console.log("Total rows:", rows[0].count);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
