const DashboardModel = require('../models/DashboardModel');

const dashboardController = {
    
    mostrarDashboard: async (req, res) => {
        try {
            // 1. Obtener totales
            const totales = await DashboardModel.obtenerTotales();

            // 2. Obtener datos para gráficos
            const resGraficos = await DashboardModel.obtenerDatosGraficos();

            // 3. Obtener detalles para tablas (NUEVO)
            const detalleMora = await DashboardModel.obtenerDetalleMora();
            const proximosVencimientos = await DashboardModel.obtenerProximosVencimientos();

            // Procesar Estados para el gráfico de torta
            let estados = { pendiente: 0, pagado: 0, vencido: 0 };
            resGraficos.distribucionPrestamos.forEach(d => {
                const est = d.estado.toLowerCase();
                if (estados.hasOwnProperty(est)) {
                    estados[est] = d.cantidad;
                }
            });

            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales: totales,
                detalleMora: detalleMora,
                proximosVencimientos: proximosVencimientos,
                graficos: {
                    estados: [estados.pendiente, estados.pagado, estados.vencido],
                    balance: [totales.totalPrestadoHistorico, totales.dineroCobrado]
                }
            });

        } catch (error) {
            console.error("Error en mostrarDashboard:", error);
            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales: { 
                    clientes: 0, dineroPrestado: 0, articulosEmpeno: 0, dineroCobrado: 0, 
                    totalAhorros: 0, clientesMora: 0, montoEnRiesgo: 0, totalPrestadoHistorico: 0 
                },
                detalleMora: [],
                proximosVencimientos: [],
                graficos: { estados: [0, 0, 0], balance: [0, 0] }
            });
        }
    }
};

module.exports = dashboardController;