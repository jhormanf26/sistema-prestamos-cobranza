const DashboardModel = require('../models/DashboardModel');
const AnalyticsModel = require('../models/AnalyticsModel');
async function run() {
    try {
        const [totales, resGraficos, detalleMora, proximosVencimientos, historialFinalizados, oportunidadesRenovacion, gastosCategoria, gastosDias, flujoCaja, gastosUsuario, analytics, leadsMarketing] = await Promise.all([
            DashboardModel.obtenerTotales(),
            DashboardModel.obtenerDatosGraficos(),
            DashboardModel.obtenerDetalleMora(),
            DashboardModel.obtenerProximosVencimientos(7),
            DashboardModel.obtenerHistorialFinalizados(),
            DashboardModel.obtenerOportunidadesRenovacion(),
            DashboardModel.obtenerGastosPorCategoria(),
            DashboardModel.obtenerGastosUltimosDias(7),
            DashboardModel.obtenerFlujoCaja(),
            DashboardModel.obtenerGastosPorUsuario(),
            AnalyticsModel.obtenerResumen(7),
            AnalyticsModel.obtenerLeadsRecientes(15)
        ]);
        console.log("totales:", totales);
        console.log("resGraficos:", resGraficos);
        console.log("flujoCaja:", flujoCaja);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
