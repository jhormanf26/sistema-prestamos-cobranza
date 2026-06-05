const AnalyticsModel = require('../models/AnalyticsModel');
async function run() {
    try {
        const res = await AnalyticsModel.obtenerResumen(7);
        console.log("Resumen output:", JSON.stringify(res, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
