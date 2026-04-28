const DashboardModel = require('../models/DashboardModel');

const dashboardController = {
    
    mostrarDashboard: async (req, res) => {
        try {
            const [totales, resGraficos, detalleMora, proximosVencimientos, historialFinalizados, oportunidadesRenovacion, gastosCategoria, gastosDias, flujoCaja, gastosUsuario] = await Promise.all([
                DashboardModel.obtenerTotales(),
                DashboardModel.obtenerDatosGraficos(),
                DashboardModel.obtenerDetalleMora(),
                DashboardModel.obtenerProximosVencimientos(),
                DashboardModel.obtenerHistorialFinalizados(),
                DashboardModel.obtenerOportunidadesRenovacion(), // La nueva consulta estratégica
                DashboardModel.obtenerGastosPorCategoria(),
                DashboardModel.obtenerGastosUltimosDias(),
                DashboardModel.obtenerFlujoCaja(),
                DashboardModel.obtenerGastosPorUsuario()
            ]);

            // Procesar datos para el gráfico conmutables (Préstamos vs Cuotas)
            const estados = {
                prestamos: { pendiente: 0, pagado: 0, vencido: 0 },
                cuotas: {
                    pendiente: resGraficos.porCuotas.pendiente || 0,
                    pagado: resGraficos.porCuotas.pagado || 0,
                    vencido: resGraficos.porCuotas.vencido || 0
                }
            };

            resGraficos.porPrestamos.forEach(d => {
                const est = d.estado.toLowerCase();
                if (estados.prestamos.hasOwnProperty(est)) {
                    estados.prestamos[est] = d.cantidad;
                }
            });

            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales,
                detalleMora,
                proximosVencimientos,
                historialFinalizados,
                oportunidadesRenovacion, // Pasamos los datos a la vista
                graficos: {
                    estados: estados,
                    balance: [totales.totalPrestadoHistorico, totales.dineroCobrado],
                    gastosCat: gastosCategoria.map(g => ({ label: g.categoria, data: g.total })),
                    gastosDias: gastosDias.map(g => {
                        const dateObj = new Date(g.fecha);
                        const labelStr = `${dateObj.getUTCDate().toString().padStart(2, '0')}/${(dateObj.getUTCMonth()+1).toString().padStart(2, '0')}`;
                        return { label: labelStr, data: g.total };
                    }),
                    flujoCaja: flujoCaja.map(f => ({ mes: f.mes, ingresos: f.ingresos, gastos: f.gastos })),
                    gastosUsuario: gastosUsuario.map(g => ({ label: g.usuario, data: g.total }))
                }
            });

        } catch (error) {
            console.error("Error Dashboard:", error);
            res.status(500).send("Error en el dashboard: " + error.message + "<br><br>" + error.stack);
        }
    }
};

module.exports = dashboardController;