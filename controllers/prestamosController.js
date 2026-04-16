const PrestamoModel = require('../models/PrestamoModel');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const PagoModel = require('../models/PagoModel'); // Asegúrate de tener este modelo importado
const emailService = require('../utils/emailService');
const finance = require('../utils/finance');
const BitacoraModel = require('../models/BitacoraModel'); // <--- TU CÓDIGO DE AUDITORÍA
const { formatCurrency } = require('../utils/formatters');

const prestamosController = {

    // 1. Listar préstamos (TU CÓDIGO ORIGINAL CON BUSCADOR Y PAGINACIÓN)
    listar: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            const busqueda = req.query.q || '';

            let prestamos;
            let totalRegistros;

            if (busqueda) {
                prestamos = await PrestamoModel.buscarPaginados(busqueda, limit, offset);
                totalRegistros = await PrestamoModel.contarBusqueda(busqueda);
            } else {
                prestamos = await PrestamoModel.obtenerPaginados(limit, offset);
                totalRegistros = await PrestamoModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);
            const config = await ConfigModel.obtener();
            const empresaConfig = config || { moneda: '$' };

            res.render('prestamos/index', { 
                title: 'Gestión de Préstamos',
                prestamos: prestamos,
                busqueda: busqueda,
                currentPage: page,
                totalPages: totalPages,
                totalRegistros: totalRegistros,
                empresa: empresaConfig
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar los préstamos');
            res.redirect('/');
        }
    },

    // 2. Formulario (TU CÓDIGO ORIGINAL)
    mostrarFormulario: async (req, res) => {
        try {
            const [clientes, config] = await Promise.all([
                ClienteModel.obtenerTodos(),
                ConfigModel.obtener()
            ]);
            const empresaConfig = config || { moneda: '$' };

            res.render('prestamos/crear', { 
                title: 'Nuevo Préstamo',
                clientes: clientes,
                empresa: empresaConfig
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar el formulario');
            res.redirect('/prestamos');
        }
    },

    // 3. Guardar (TU CÓDIGO ORIGINAL CON EMAIL Y BITÁCORA)
    guardar: async (req, res) => {
        try {
            const { cliente_id, monto, interes, cuotas, frecuencia, fecha_inicio } = req.body;
            const usuarioActual = (req.session && req.session.usuario) ? req.session.usuario.nombre : 'Administrador';

            if (!cliente_id || !monto || !cuotas || !fecha_inicio) {
                req.flash('mensajeError', 'Por favor complete los campos obligatorios');
                return res.redirect('/prestamos/crear');
            }

            const montoPrestado = parseFloat(monto);
            const tasa = parseFloat(interes);
            const numCuotas = parseInt(cuotas);
            const montoInteres = montoPrestado * (tasa / 100);
            const montoTotal = montoPrestado + montoInteres;

            let fechaFin = new Date(fecha_inicio);
            if (frecuencia === 'diario') fechaFin.setDate(fechaFin.getDate() + numCuotas);
            else if (frecuencia === 'semanal') fechaFin.setDate(fechaFin.getDate() + (numCuotas * 7));
            else if (frecuencia === 'mensual') fechaFin.setMonth(fechaFin.getMonth() + numCuotas);

            const fechaFinStr = fechaFin.toISOString().split('T')[0];

            await PrestamoModel.crear({
                cliente_id,
                monto_prestado: montoPrestado,
                tasa_interes: tasa,
                monto_total: montoTotal,
                cuotas: numCuotas,
                frecuencia,
                fecha_inicio,
                fecha_fin: fechaFinStr
            });

            // TU AUDITORÍA
            await BitacoraModel.registrar(usuarioActual, 'NUEVO_PRESTAMO', `Monto: ${montoPrestado} - Cliente ID: ${cliente_id}`);

            // TU ENVÍO DE CORREO
            const cliente = await ClienteModel.obtenerPorId(cliente_id);
            if (cliente && cliente.email) {
                let config = await ConfigModel.obtener();
                const simboloMoneda = config ? config.moneda : '$';
                const htmlCorreo = emailService.plantillaPrestamo(`${cliente.nombre} ${cliente.apellido}`, montoPrestado, cuotas, montoTotal, simboloMoneda);
                emailService.enviarCorreo(cliente.email, '¡Préstamo Aprobado!', htmlCorreo);
            }

            req.flash('mensajeExito', 'Préstamo registrado correctamente');
            res.redirect('/prestamos');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear el préstamo');
            res.redirect('/prestamos/crear');
        }
    },

    // 4. Ver Vencidos (TU CÓDIGO ORIGINAL)
    verVencidos: async (req, res) => {
        try {
            const vencidos = await PrestamoModel.obtenerVencidos();
            const config = await ConfigModel.obtener();
            res.render('prestamos/vencidos', { 
                title: 'Reporte de Morosidad',
                vencidos: vencidos,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar vencimientos');
            res.redirect('/prestamos');
        }
    },

    // 5. Ver Cronograma (AQUÍ ESTÁ LA CORRECCIÓN DEL VIDEO 1)
    // Se mantiene la estructura pero agregamos el cruce de pagos
    verCronograma: async (req, res) => {
        const { id } = req.params;
        try {
            const prestamo = await PrestamoModel.obtenerPorId(id);
            if(!prestamo) {
                req.flash('mensajeError', 'Préstamo no encontrado');
                return res.redirect('/prestamos');
            }

            // --- INICIO CORRECCIÓN ---
            // 1. Traemos los pagos reales
            const pagos = await PagoModel.obtenerHistorial(id);
            
            // 2. Sumamos cuánto ha pagado el cliente
            let totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.monto_pagado), 0);
            // --- FIN CORRECCIÓN ---

            // Calculamos el cronograma teórico (TU CÓDIGO)
            let cronograma = finance.calcularCronograma(
                parseFloat(prestamo.monto_total), 
                prestamo.cuotas, 
                prestamo.frecuencia, 
                prestamo.fecha_inicio
            );

            // --- INICIO CORRECCIÓN: CRUZAR DATOS ---
            // Recorremos las cuotas para marcar las pagadas
            cronograma = cronograma.map(cuota => {
                const montoCuota = parseFloat(cuota.monto);
                
                // Si el dinero acumulado cubre la cuota
                if (totalPagado >= (montoCuota - 0.1)) {
                    cuota.estado = 'Pagado';
                    cuota.clase = 'success'; // Verde
                    totalPagado -= montoCuota; // Restamos del saldo disponible
                } else if (totalPagado > 0) {
                    // Pago parcial
                    cuota.estado = `Parcial (Falta: ${formatCurrency(montoCuota - totalPagado, 2)})`;
                    cuota.clase = 'warning'; // Amarillo
                    totalPagado = 0;
                } else {
                    // No hay dinero para esta cuota
                    cuota.estado = 'Programado'; 
                    cuota.clase = 'secondary'; // Gris
                }
                return cuota;
            });
            // --- FIN CORRECCIÓN ---

            const config = await ConfigModel.obtener();

            res.render('prestamos/cronograma', {
                title: 'Cronograma de Pagos',
                prestamo,
                cronograma, // Ahora enviamos el cronograma con estados reales
                empresa: config || { moneda: '$' }
            });

        } catch (error) {
            console.error(error);
            res.redirect('/prestamos');
        }
    }
};

module.exports = prestamosController;