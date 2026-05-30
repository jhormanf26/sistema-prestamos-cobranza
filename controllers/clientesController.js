const ClienteModel = require('../models/ClienteModel');
const db = require('../config/db');
const PrestamoModel = require('../models/PrestamoModel'); // Asegúrate de tener este modelo si usas verPerfil
const EmpenoModel = require('../models/EmpenoModel');    // Asegúrate de tener este modelo
const AhorroModel = require('../models/AhorroModel');    // Asegúrate de tener este modelo
const ConfigModel = require('../models/ConfigModel');    // Asegúrate de tener este modelo
const ClienteDocumentoModel = require('../models/ClienteDocumentoModel');
const emailService = require('../utils/emailService');
const scoringService = require('../utils/scoringService');

const clientesController = {

    // 1. Listar (MANTIENE PAGINACIÓN Y BÚSQUEDA)
    listar: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;
            const busqueda = req.query.q || '';

            let clientes;
            let totalRegistros;

            if (busqueda) {
                clientes = await ClienteModel.buscarPaginados(busqueda, limit, offset);
                totalRegistros = await ClienteModel.contarBusqueda(busqueda);
            } else {
                clientes = await ClienteModel.obtenerPaginados(limit, offset);
                totalRegistros = await ClienteModel.contarTotal();
            }

            const totalPages = Math.ceil(totalRegistros / limit);

            res.render('clientes/index', { 
                title: 'Gestión de Clientes',
                clientes: clientes,
                busqueda: busqueda,
                currentPage: page,
                totalPages: totalPages,
                totalRegistros: totalRegistros
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al obtener los clientes');
            res.redirect('/');
        }
    },

    // 2. Formulario Crear (MANTIENE FUNCIONALIDAD)
    mostrarFormulario: (req, res) => {
        res.render('clientes/crear', { 
            title: 'Nuevo Cliente'
        });
    },

    // 3. Guardar Cliente (MANTIENE FOTO)
    guardar: async (req, res) => {
        const { dni, nombre, apellido, telefono, direccion, email, monto_preaprobado } = req.body;
        const foto = req.file ? req.file.filename : null;

        // Limpiar monto_preaprobado de puntos de miles
        const montoLimpio = monto_preaprobado ? parseFloat(monto_preaprobado.replace(/\./g, '')) : 0;

        if (!dni || !nombre || !apellido) {
            req.flash('mensajeError', 'CC, Nombre y Apellido son obligatorios');
            return res.redirect('/clientes/crear');
        }

        try {
            const existe = await ClienteModel.buscarPorDNI(dni);
            if (existe) {
                req.flash('mensajeError', 'El cliente con ese CC ya existe');
                return res.redirect('/clientes/crear');
            }

            await ClienteModel.crear({ 
                dni, nombre, apellido, telefono, direccion, email, foto, 
                monto_preaprobado: montoLimpio 
            });
            req.flash('mensajeExito', 'Cliente registrado correctamente');
            res.redirect('/clientes');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al guardar el cliente');
            res.redirect('/clientes/crear');
        }
    },

    // 4. Ver Perfil (MANTIENE PERFIL COMPLETO)
    verPerfil: async (req, res) => {
        const { id } = req.params;
        try {
            // Usamos Promise.all para cargar todo rápido
            // Nota: Si no tienes alguno de estos modelos importados arriba, coméntalo para que no falle
            const [cliente, prestamos, empenos, cuentaAhorro, config, documentos] = await Promise.all([
                ClienteModel.obtenerPorId(id),
                PrestamoModel ? PrestamoModel.obtenerPorCliente(id) : [],
                EmpenoModel ? EmpenoModel.obtenerPorCliente(id) : [],
                AhorroModel ? AhorroModel.buscarPorCliente(id) : null,
                ConfigModel ? ConfigModel.obtener() : {},
                ClienteDocumentoModel.obtenerPorCliente(id)
            ]);

            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado');
                return res.redirect('/clientes');
            }

            const empresaConfig = config || { moneda: '$' };

            // Calcular Score Crediticio
            let scoreData = null;
            try {
                scoreData = await scoringService.calcularScore(id);
                await ClienteModel.actualizarScore(id, scoreData.score);
                cliente.score = scoreData.score;
                cliente.score_fecha = scoreData.fechaCalculo;
            } catch (scoreErr) {
                console.error("Error al calcular score del cliente en perfil administrativo:", scoreErr);
            }

            // Consultas financieras detalladas de préstamos de este cliente
            const [[totalesPrestamos]] = await db.query(`
                SELECT 
                    COALESCE(SUM(monto_prestado), 0) as totalPrestado,
                    COALESCE(SUM(monto_total), 0) as totalDeuda
                FROM prestamos 
                WHERE cliente_id = ? AND estado != 'anulado'
            `, [id]);

            const [[totalesPagos]] = await db.query(`
                SELECT 
                    COALESCE(SUM(pg.monto_pagado), 0) as totalPagado,
                    COALESCE(SUM(pg.monto_pagado * (p.monto_total - p.monto_prestado) / p.monto_total), 0) as totalIntereses
                FROM pagos pg
                JOIN prestamos p ON pg.prestamo_id = p.id
                WHERE p.cliente_id = ? AND p.estado != 'anulado'
            `, [id]);

            const totalPrestado = parseFloat(totalesPrestamos.totalPrestado);
            const totalDeuda = parseFloat(totalesPrestamos.totalDeuda);
            const totalPagado = parseFloat(totalesPagos.totalPagado);
            const totalInteresesGenerados = parseFloat(totalesPagos.totalIntereses);
            const totalDebe = Math.max(0, totalDeuda - totalPagado);
            const totalCapitalDevuelto = Math.max(0, totalPagado - totalInteresesGenerados);

            const resumenFinanciero = {
                totalPrestado,
                totalPagado,
                totalDebe,
                totalInteresesGenerados,
                totalCapitalDevuelto
            };

            res.render('clientes/perfil', {
                title: `Perfil de ${cliente.nombre}`,
                cliente,
                scoreData,
                prestamos: prestamos || [],
                empenos: empenos || [],
                cuentaAhorro,
                empresa: empresaConfig,
                documentos: documentos || [],
                resumenFinanciero
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cargar perfil');
            res.redirect('/clientes');
        }
    },

    // 5. Mostrar Edición
    mostrarEdicion: async (req, res) => {
        const { id } = req.params;
        try {
            const cliente = await ClienteModel.obtenerPorId(id);
            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado');
                return res.redirect('/clientes');
            }
            res.render('clientes/editar', {
                title: 'Editar Cliente',
                cliente
            });
        } catch (error) {
            console.error(error);
            res.redirect('/clientes');
        }
    },

    // 6. Procesar Edición (MANTIENE FOTO)
    actualizar: async (req, res) => {
        const { id } = req.params;
        const { dni, nombre, apellido, telefono, direccion, email, monto_preaprobado } = req.body;
        const foto = req.file ? req.file.filename : null;

        // Limpiar monto_preaprobado de puntos de miles
        const montoLimpio = monto_preaprobado ? parseFloat(monto_preaprobado.replace(/\./g, '')) : 0;

        try {
            await ClienteModel.actualizar(id, { 
                dni, nombre, apellido, telefono, direccion, email, foto, 
                monto_preaprobado: montoLimpio 
            });
            req.flash('mensajeExito', 'Datos del cliente actualizados');
            res.redirect('/clientes');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar');
            res.redirect(`/clientes/editar/${id}`);
        }
    },

    // 7. (NUEVO) CAMBIAR ESTADO
    // Esta es la función nueva para Activar/Desactivar
    cambiarEstado: async (req, res) => {
        const { id } = req.params;
        try {
            const cliente = await ClienteModel.obtenerPorId(id);
            if (!cliente) {
                req.flash('mensajeError', 'Cliente no encontrado.');
                return res.redirect('/clientes');
            }

            // Si estado es null o undefined, asumimos que es 1 (Activo)
            const estadoActual = (cliente.estado === undefined || cliente.estado === null) ? 1 : cliente.estado;
            const nuevoEstado = (estadoActual == 1) ? 0 : 1;

            await ClienteModel.cambiarEstado(id, nuevoEstado);

            const accion = (nuevoEstado == 1) ? 'Habilitado' : 'Inhabilitado';
            req.flash('mensajeExito', `El cliente ${cliente.nombre} ha sido ${accion}.`);
            res.redirect('/clientes');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cambiar estado.');
            res.redirect('/clientes');
        }
    },

    // 8. Enviar Correo de Pre-aprobado
    enviarCorreoPreaprobado: async (req, res) => {
        const { id } = req.params;
        try {
            const [cliente, config] = await Promise.all([
                ClienteModel.obtenerPorId(id),
                ConfigModel.obtener()
            ]);

            if (!cliente || !cliente.email) {
                return res.json({ success: false, mensaje: 'El cliente no tiene correo registrado.' });
            }

            if (!cliente.monto_preaprobado || cliente.monto_preaprobado <= 0) {
                return res.json({ success: false, mensaje: 'El cliente no tiene un monto pre-aprobado asignado.' });
            }

            const { asunto, html } = await emailService.plantillaPreaprobado(
                `${cliente.nombre} ${cliente.apellido}`,
                cliente.monto_preaprobado,
                config ? config.moneda : '$',
                config ? config.telefono : null
            );

            await emailService.enviarCorreo(cliente.email, asunto || '¡Tienes un crédito pre-aprobado!', html);
            
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.json({ success: false, mensaje: 'Error al enviar el correo.' });
        }
    },

    // 9. Actualizar solo el monto pre-aprobado (AJAX)
    actualizarPreaprobado: async (req, res) => {
        const { id } = req.params;
        const { monto } = req.body;
        try {
            // Limpiar monto de puntos de miles
            const montoLimpio = monto ? parseFloat(monto.toString().replace(/\./g, '').replace(/,/g, '.')) : 0;
            
            await ClienteModel.actualizarPreaprobado(id, montoLimpio);
            res.json({ success: true, nuevoMonto: montoLimpio });
        } catch (error) {
            console.error(error);
            res.json({ success: false, mensaje: 'Error al actualizar el cupo.' });
        }
    },

    // 10. Recalcular Score Crediticio de Cliente desde Administración (AJAX)
    recalcularScoreAdmin: async (req, res) => {
        const { id } = req.params;
        try {
            const scoreData = await scoringService.calcularScore(id);
            await ClienteModel.actualizarScore(id, scoreData.score);

            // Enriquecer respuesta con la tasa sugerida según el score calculado
            const tasaInfo = scoringService.obtenerTasaPorScore(scoreData.score);

            res.json({
                success: true,
                scoreData,
                tasaSugerida: tasaInfo.tasaMensual,
                tasaMoraSugerida: tasaInfo.tasaMora,
                tasaDescripcion: tasaInfo.descripcion
            });
        } catch (error) {
            console.error('Error en recalcularScoreAdmin:', error);
            res.status(500).json({ success: false, mensaje: 'Error al recalcular el score.' });
        }
    },

    /**
     * Obtiene el score actual de un cliente (desde BD, sin recalcular) y la tasa sugerida.
     * Usado por el formulario de crear préstamo para sugerir tasas en tiempo real.
     *
     * @param {Object} req - Request de Express con `req.params.id` (ID del cliente).
     * @param {Object} res - Response de Express con JSON { success, score, categoria, tasaSugerida, tasaMoraSugerida }.
     */
    obtenerScore: async (req, res) => {
        const { id } = req.params;
        try {
            const cliente = await ClienteModel.obtenerPorId(id);
            if (!cliente) {
                return res.status(404).json({ success: false, mensaje: 'Cliente no encontrado.' });
            }

            const score = parseFloat(cliente.score || 0);
            const tasaInfo = scoringService.obtenerTasaPorScore(score);

            res.json({
                success: true,
                score,
                categoria: tasaInfo.categoria,
                tasaSugerida: tasaInfo.tasaMensual,
                tasaMoraSugerida: tasaInfo.tasaMora,
                descripcion: tasaInfo.descripcion
            });
        } catch (error) {
            console.error('Error en obtenerScore:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener el score.' });
        }
    }
};

module.exports = clientesController;
