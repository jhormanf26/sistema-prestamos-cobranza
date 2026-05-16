const DashboardModel = require('../models/DashboardModel');
const AnalyticsModel = require('../models/AnalyticsModel');

const dashboardController = {
    
    mostrarDashboard: async (req, res) => {
        try {
            const diasVencimiento = parseInt(req.query.diasVencimiento) || 7;
            const diasGastos = parseInt(req.query.diasGastos) || 7;
            const diasMarketing = parseInt(req.query.diasMarketing) || 7;
            const [totales, resGraficos, detalleMora, proximosVencimientos, historialFinalizados, oportunidadesRenovacion, gastosCategoria, gastosDias, flujoCaja, gastosUsuario, analytics, leadsMarketing] = await Promise.all([
                DashboardModel.obtenerTotales(),
                DashboardModel.obtenerDatosGraficos(),
                DashboardModel.obtenerDetalleMora(),
                DashboardModel.obtenerProximosVencimientos(diasVencimiento),
                DashboardModel.obtenerHistorialFinalizados(),
                DashboardModel.obtenerOportunidadesRenovacion(),
                DashboardModel.obtenerGastosPorCategoria(),
                DashboardModel.obtenerGastosUltimosDias(diasGastos),
                DashboardModel.obtenerFlujoCaja(),
                DashboardModel.obtenerGastosPorUsuario(),
                AnalyticsModel.obtenerResumen(diasMarketing),
                AnalyticsModel.obtenerLeadsRecientes(15)
            ]);

            res.render('index', { 
                title: 'Panel de Control',
                pagina: 'dashboard',
                totales: totales || {},
                detalleMora: detalleMora || [],
                proximosVencimientos: proximosVencimientos || [],
                diasVencimiento,
                diasGastos,
                diasMarketing,
                historialFinalizados: historialFinalizados || [],
                oportunidadesRenovacion: oportunidadesRenovacion || [],
                analytics: analytics || { totalVisitas: 0, totalClics: 0, totalLeads: 0, conversionRate: 0, eventosHoy: 0, visitantesUnicos: 0, historial: [], scrollDepth: { v25: 0, v50: 0, v75: 0, v90: 0 } },
                leadsMarketing: leadsMarketing || [],
                graficos: {
                    estados: {
                        prestamos: {
                            pendiente: resGraficos?.porPrestamos?.find(p => p.estado?.toLowerCase() === 'pendiente')?.cantidad || 0,
                            pagado: resGraficos?.porPrestamos?.find(p => p.estado?.toLowerCase() === 'pagado')?.cantidad || 0,
                            vencido: resGraficos?.porPrestamos?.find(p => p.estado?.toLowerCase() === 'vencido')?.cantidad || 0
                        },
                        cuotas: resGraficos?.porCuotas || { pendiente: 0, pagado: 0, vencido: 0 }
                    },
                    balance: [totales?.totalPrestadoHistorico || 0, totales?.dineroCobrado || 0],
                    ganancias: resGraficos?.ganancias || { capitalRecuperado: 0, gananciaRealizada: 0, capitalPendiente: 0, gananciaPendiente: 0 },
                    gastosCat: (gastosCategoria || []).map(g => ({ label: g.categoria, data: g.total })),
                    gastosDias: (gastosDias || []).map(g => {
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