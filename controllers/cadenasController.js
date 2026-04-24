const CadenaModel = require('../models/CadenaModel');
const ConfigModel = require('../models/ConfigModel');
const emailService = require('../utils/emailService');

const cadenasController = {

    // Listar
    listar: async (req, res) => {
        try {
            const cadenas = await CadenaModel.obtenerTodas();
            const config = await ConfigModel.obtener();
            res.render('cadenas/index', {
                title: 'Cadenas de Ahorro',
                cadenas,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    // Formulario Crear
    crear: async (req, res) => {
        res.render('cadenas/crear', {
            title: 'Nueva Cadena de Ahorro'
        });
    },

    // Guardar
    guardar: async (req, res) => {
        try {
            // Sanitizar monto (quitar puntos de miles)
            if (req.body.monto_cuota) {
                req.body.monto_cuota = req.body.monto_cuota.replace(/\./g, '').replace(',', '.');
            }
            
            await CadenaModel.crear(req.body);
            req.flash('mensajeExito', 'Cadena creada exitosamente');
            res.redirect('/cadenas');
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al crear la cadena');
            res.redirect('/cadenas/crear');
        }
    },

    // Ver Detalle
    ver: async (req, res) => {
        try {
            const { id } = req.params;
            const cadena = await CadenaModel.obtenerPorId(id);
            if (!cadena) return res.redirect('/cadenas');

            const cicloActual = cadena.ciclo_actual;
            const diasRestantes = CadenaModel.calcularDiasRestantes(cadena.fecha_inicio, cadena.frecuencia, cicloActual);
            const rangoCiclo = CadenaModel.obtenerRangoCiclo(cadena.fecha_inicio, cadena.frecuencia, cicloActual);
            
            // Verificar si el ciclo está completado
            const todosPagaron = cadena.participantes.every(p => p.pagado_actual);
            const premioEntregado = cadena.participantes.some(p => p.turno === cicloActual && p.estado_entrega);
            const puedeAvanzar = todosPagaron && premioEntregado && (cicloActual < cadena.numero_participantes);

            const config = await ConfigModel.obtener();

            res.render('cadenas/ver', {
                title: 'Detalle de Cadena',
                cadena,
                cicloActual,
                diasRestantes,
                rangoCiclo,
                puedeAvanzar,
                todosPagaron,
                empresa: config || { moneda: '$' }
            });
        } catch (error) {
            console.error(error);
            res.redirect('/cadenas');
        }
    },

    // Agregar Participante
    agregarParticipante: async (req, res) => {
        const { id } = req.params;
        const { nombre, telefono, email, turno } = req.body;
        try {
            await CadenaModel.agregarParticipante(id, nombre, telefono, email, turno);
            req.flash('mensajeExito', 'Participante añadido correctamente');
            res.redirect(`/cadenas/ver/${id}`);
        } catch (error) {
            req.flash('mensajeError', error.message);
            res.redirect(`/cadenas/ver/${id}`);
        }
    },

    // Registrar Pago
    registrarPago: async (req, res) => {
        const { id_participante, id_cadena, ciclo } = req.body;
        try {
            await CadenaModel.registrarPago(id_participante, id_cadena, ciclo);
            req.flash('mensajeExito', 'Pago registrado');
            res.redirect(`/cadenas/ver/${id_cadena}`);
        } catch (error) {
            req.flash('mensajeError', 'Error al registrar pago');
            res.redirect(`/cadenas/ver/${id_cadena}`);
        }
    },

    // Entregar Acumulado
    entregar: async (req, res) => {
        const { id_participante, id_cadena } = req.body;
        try {
            await CadenaModel.entregarAcumulado(id_participante);
            
            // Lógica de finalización automática
            const cadena = await CadenaModel.obtenerPorId(id_cadena);
            const todosEntregados = cadena.participantes.every(p => p.estado_entrega);
            
            if (todosEntregados && (cadena.ciclo_actual === cadena.numero_participantes)) {
                await CadenaModel.finalizar(id_cadena);
                req.flash('mensajeExito', '¡Felicidades! La cadena ha sido completada y finalizada exitosamente.');
            } else {
                req.flash('mensajeExito', 'Acumulado entregado correctamente.');
            }

            res.redirect(`/cadenas/ver/${id_cadena}`);
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al marcar entrega');
            res.redirect(`/cadenas/ver/${id_cadena}`);
        }
    },

    // Avanzar de Ciclo
    avanzarCiclo: async (req, res) => {
        const { id } = req.params;
        try {
            await CadenaModel.avanzarCiclo(id);
            req.flash('mensajeExito', 'Has avanzado al siguiente ciclo de ahorro.');
            res.redirect(`/cadenas/ver/${id}`);
        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al avanzar de ciclo.');
            res.redirect(`/cadenas/ver/${id}`);
        }
    },

    // Enviar Recordatorio
    enviarRecordatorio: async (req, res) => {
        const { id } = req.params;
        try {
            const participante = await CadenaModel.obtenerParticipantePorId(id);
            
            if (!participante || !participante.email) {
                return res.json({ success: false, mensaje: 'El participante no tiene correo registrado.' });
            }

            const config = await ConfigModel.obtener();
            const { asunto, html } = await emailService.plantillaCadena(
                participante.nombre,
                participante.monto_cuota,
                participante.cadena_nombre,
                participante.ciclo_actual,
                config ? config.moneda : '$'
            );

            await emailService.enviarCorreo(participante.email, asunto || 'Recordatorio de Ahorro', html);
            
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.json({ success: false, mensaje: 'Error al enviar el recordatorio.' });
        }
    }
};

module.exports = cadenasController;
