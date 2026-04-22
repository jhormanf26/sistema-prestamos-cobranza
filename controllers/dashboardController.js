const DashboardModel = require('../models/DashboardModel');

const dashboardController = {
    
    mostrarDashboard: async (req, res) => {
        try {
            const [totales, resGraficos, detalleMora, proximosVencimientos, historialFinalizados] = await Promise.all([
                DashboardModel.obtenerTotales(),
                DashboardModel.obtenerDatosGraficos(),
                DashboardModel.obtenerDetalleMora(),
                DashboardModel.obtenerProximosVencimientos(),
                DashboardModel.obtenerHistorialFinalizados()
            ]);

            // Procesar Estados para el gráfico
            let estados = { pendiente: 0, pagado: 0, vencido: 0 };
            resGraficos.distribucionPrestamos.forEach(d => {
                const est = d.estado.toLowerCase();
                if (estados.hasOwnProperty(est)) estados[est] = d.cantidad;
            });

            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales,
                detalleMora,
                proximosVencimientos,
                historialFinalizados, // Cargamos los datos para la nueva tabla
                graficos: {
                    estados: [estados.pendiente, estados.pagado, estados.vencido],
                    balance: [totales.totalPrestadoHistorico, totales.dineroCobrado]
                }
            });

        } catch (error) {
            console.error("Error Dashboard:", error);
            res.redirect('/');
        }
    }
};

module.exports = dashboardController;