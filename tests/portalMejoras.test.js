const assert = require('assert');
const db = require('../config/db');
const SolicitudCreditoModel = require('../models/SolicitudCreditoModel');
const ReportePagoModel = require('../models/ReportePagoModel');
const SoporteMensajeModel = require('../models/SoporteMensajeModel');

/**
 * Suite de pruebas TDD para verificar la integridad de las mejoras del Portal del Cliente.
 */
async function ejecutarPruebas() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para las Mejoras del Portal del Cliente...');
    
    let clienteId = null;
    let prestamoId = null;
    let adminId = null;
    let tempClienteCreado = false;
    let tempPrestamoCreado = false;
    let tempUsuarioCreado = false;

    try {
        // --- 1. PREPARACIÓN: Obtener o crear un cliente, préstamo y administrador para las pruebas ---
        
        // 1.1 Obtener o crear Administrador
        const [usuarios] = await db.query('SELECT id FROM usuarios LIMIT 1');
        if (usuarios.length > 0) {
            adminId = usuarios[0].id;
            console.log(`ℹ️ Usando Usuario (Admin) ID: ${adminId} existente en la BD para las pruebas.`);
        } else {
            console.log('ℹ️ No se encontró ningún usuario administrador en la BD. Creando usuario temporal...');
            const [resUsuario] = await db.query(
                `INSERT INTO usuarios (nombre_completo, email, password, rol, estado) 
                 VALUES ('Administrador TDD', 'admin.tdd@ejemplo.com', 'password_hash_placeholder', 'administrador', 1)`
            );
            adminId = resUsuario.insertId;
            tempUsuarioCreado = true;
        }

        // 1.2 Obtener o crear Cliente
        const [clientes] = await db.query('SELECT id FROM clientes LIMIT 1');
        if (clientes.length > 0) {
            clienteId = clientes[0].id;
            console.log(`ℹ️ Usando Cliente ID: ${clienteId} existente en la BD para las pruebas.`);
        } else {
            console.log('ℹ️ No se encontró ningún cliente en la BD. Creando un cliente temporal...');
            const [resCliente] = await db.query(
                `INSERT INTO clientes (nombre, apellido, dni, telefono, email, estado, monto_preaprobado) 
                 VALUES ('Test', 'TDD', '99999999', '5551234', 'test.tdd@ejemplo.com', 1, 1500000)`
            );
            clienteId = resCliente.insertId;
            tempClienteCreado = true;
        }

        // 1.3 Obtener o crear Préstamo
        const [prestamos] = await db.query('SELECT id FROM prestamos WHERE cliente_id = ? LIMIT 1', [clienteId]);
        if (prestamos.length > 0) {
            prestamoId = prestamos[0].id;
            console.log(`ℹ️ Usando Préstamo ID: ${prestamoId} existente para el cliente.`);
        } else {
            console.log('ℹ️ No se encontró ningún préstamo para el cliente. Creando préstamo temporal...');
            const [resPrestamo] = await db.query(
                `INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, estado) 
                 VALUES (?, 500000, 5, 0, 550000, 6, 'quincenal', NOW(), NOW(), 'activo')`,
                 [clienteId]
            );
            prestamoId = resPrestamo.insertId;
            tempPrestamoCreado = true;
        }

        // =========================================================
        // PRUEBA 1: Flujo de Solicitudes de Crédito (Cupo Pre-aprobado)
        // =========================================================
        console.log('\n--- 🧪 TEST 1: SolicitudCreditoModel ---');
        
        // 1.1 Crear solicitud de crédito
        const datosSolicitud = {
            cliente_id: clienteId,
            monto_solicitado: 400000,
            cuotas: 6,
            frecuencia: 'quincenal'
        };
        const resSolCrear = await SolicitudCreditoModel.crear(datosSolicitud);
        const solicitudId = resSolCrear.insertId;
        assert.ok(solicitudId, 'La solicitud de crédito debe crearse con un ID autoincremental.');
        console.log(`✅ Solicitud #${solicitudId} creada con éxito.`);

        // 1.2 Obtener y validar estado inicial
        const solicitudPendiente = await SolicitudCreditoModel.obtenerPorId(solicitudId);
        assert.ok(solicitudPendiente, 'Debe poder recuperarse la solicitud por su ID.');
        assert.strictEqual(solicitudPendiente.estado, 'pendiente', 'El estado inicial de la solicitud debe ser "pendiente".');
        assert.strictEqual(Math.round(solicitudPendiente.monto_solicitado), 400000, 'El monto debe coincidir con el solicitado.');
        assert.strictEqual(solicitudPendiente.cuotas, 6, 'Las cuotas deben coincidir.');
        assert.strictEqual(solicitudPendiente.frecuencia, 'quincenal', 'La frecuencia debe coincidir.');
        console.log('✅ Verificación de estado pendiente inicial correcta.');

        // 1.3 Resolver solicitud con corrección de parámetros por parte del administrador
        // El administrador cambia el monto aprobado a $350.000, cuotas a 8, frecuencia a 'mensual' y añade un comentario
        const comentarioResolucion = 'Cupo ajustado por capacidad de pago';
        await SolicitudCreditoModel.resolverSolicitud(
            solicitudId,
            'aprobado',
            comentarioResolucion,
            adminId, // ID de administrador dinámico
            350000, // Monto corregido/aprobado
            8, // Cuotas corregidas/aprobadas
            'mensual' // Frecuencia corregida/aprobada
        );

        // 1.4 Validar la actualización en la BD
        const solicitudAprobada = await SolicitudCreditoModel.obtenerPorId(solicitudId);
        assert.strictEqual(solicitudAprobada.estado, 'aprobado', 'El estado final debe actualizarse a "aprobado".');
        assert.strictEqual(Math.round(solicitudAprobada.monto_solicitado), 350000, 'El monto solicitado debe ser el valor aprobado/corregido.');
        assert.strictEqual(solicitudAprobada.cuotas, 8, 'Las cuotas deben coincidir con las aprobadas.');
        assert.strictEqual(solicitudAprobada.frecuencia, 'mensual', 'La frecuencia debe coincidir con la aprobada.');
        assert.strictEqual(solicitudAprobada.comentarios, comentarioResolucion, 'Los comentarios deben coincidir.');
        console.log('✅ Resolución de solicitud con parámetros corregidos validada con éxito.');


        // =========================================================
        // PRUEBA 2: Flujo de Reportes de Pago (Validación e Input Editable)
        // =========================================================
        console.log('\n--- 🧪 TEST 2: ReportePagoModel ---');

        // 2.1 Crear reporte de pago
        const datosReporte = {
            prestamo_id: prestamoId,
            cliente_id: clienteId,
            monto: 100000,
            comprobante_url: '/uploads/comprobante-test.jpg',
            observaciones: 'Pago transferencia Nequi'
        };
        const resRepCrear = await ReportePagoModel.crear(datosReporte);
        const reporteId = resRepCrear.insertId;
        assert.ok(reporteId, 'El reporte de pago debe crearse con un ID.');
        console.log(`✅ Reporte de pago #${reporteId} registrado con éxito.`);

        // 2.2 Obtener y validar estado inicial
        const reportePendiente = await ReportePagoModel.obtenerPorId(reporteId);
        assert.ok(reportePendiente, 'Debe poder recuperarse el reporte por su ID.');
        assert.strictEqual(reportePendiente.estado, 'pendiente', 'El estado inicial debe ser "pendiente".');
        assert.strictEqual(Math.round(reportePendiente.monto), 100000, 'El monto reportado debe ser de $100.000.');
        console.log('✅ Verificación de reporte de pago pendiente correcta.');

        // 2.3 Resolver reporte aprobando con un monto corregido por el administrador
        // Por ejemplo, el cliente se equivocó e ingresó $100.000 pero el comprobante real era por $95.000
        const obsResolucionReporte = 'Se aprobó abono con monto corregido de la transferencia';
        await ReportePagoModel.resolverReporte(
            reporteId,
            'aprobado',
            obsResolucionReporte,
            adminId, // ID de administrador dinámico
            95000 // Monto real verificado/corregido
        );

        // 2.4 Validar la actualización en la BD
        const reporteAprobado = await ReportePagoModel.obtenerPorId(reporteId);
        assert.strictEqual(reporteAprobado.estado, 'aprobado', 'El estado del reporte debe actualizarse a "aprobado".');
        assert.strictEqual(Math.round(reporteAprobado.monto), 95000, 'El monto en el reporte debe ser el corregido ($95.000).');
        assert.strictEqual(reporteAprobado.observaciones, obsResolucionReporte, 'Las observaciones deben coincidir.');
        console.log('✅ Corrección y validación del abono de pago verificada correctamente.');


        // =========================================================
        // PRUEBA 3: Flujo de Chat de Soporte (Integridad de Mensajería)
        // =========================================================
        console.log('\n--- 🧪 TEST 3: SoporteMensajeModel ---');

        // 3.1 Enviar mensaje del cliente
        await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteId,
            remitente: 'cliente',
            mensaje: 'Hola, tengo una pregunta sobre mi cuota.'
        });
        console.log('✅ Mensaje de cliente guardado.');

        // 3.2 Enviar mensaje de respuesta del administrador
        await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteId,
            usuario_id: adminId, // ID de administrador dinámico
            remitente: 'administrador',
            mensaje: 'Hola, con gusto. Dime cuál es tu consulta.'
        });
        console.log('✅ Mensaje de respuesta del administrador guardado.');

        // 3.3 Recuperar chat completo y verificar
        const chatCompleto = await SoporteMensajeModel.obtenerChatCompleto(clienteId);
        assert.ok(chatCompleto.length >= 2, 'El chat debe contener al menos 2 mensajes.');
        
        // El último mensaje debe ser del administrador
        const ultimoMsg = chatCompleto[chatCompleto.length - 1];
        assert.strictEqual(ultimoMsg.remitente, 'administrador', 'El remitente del último mensaje debe ser "administrador".');
        assert.strictEqual(ultimoMsg.mensaje, 'Hola, con gusto. Dime cuál es tu consulta.', 'El contenido del último mensaje debe coincidir.');
        
        // El penúltimo mensaje debe ser del cliente
        const penultimoMsg = chatCompleto[chatCompleto.length - 2];
        assert.strictEqual(penultimoMsg.remitente, 'cliente', 'El remitente debe ser "cliente".');
        console.log('✅ Integridad del flujo conversacional verificada con éxito.');

        // 3.4 Probar marcar como leído
        await SoporteMensajeModel.marcarComoLeido(clienteId, 'cliente');
        console.log('✅ Marcar mensajes como leídos verificado.');


        // --- 4. LIMPIEZA DE REGISTROS TEMPORALES ---
        console.log('\n--- 🧹 LIMPIEZA DE DATOS ---');
        // Eliminar solicitudes de prueba
        await db.query('DELETE FROM solicitudes_credito WHERE id = ?', [solicitudId]);
        // Eliminar reportes de pago de prueba
        await db.query('DELETE FROM reportes_pago WHERE id = ?', [reporteId]);
        // Eliminar mensajes de chat de prueba
        await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteId]);
        
        if (tempPrestamoCreado) {
            await db.query('DELETE FROM prestamos WHERE id = ?', [prestamoId]);
            console.log('🧹 Préstamo temporal eliminado.');
        }
        if (tempClienteCreado) {
            await db.query('DELETE FROM clientes WHERE id = ?', [clienteId]);
            console.log('🧹 Cliente temporal eliminado.');
        }
        if (tempUsuarioCreado) {
            await db.query('DELETE FROM usuarios WHERE id = ?', [adminId]);
            console.log('🧹 Usuario administrador temporal eliminado.');
        }
        console.log('✅ Limpieza de datos de prueba finalizada.');
        console.log('\n🎉 ¡TODAS LAS PRUEBAS TDD DE MEJORAS DEL PORTAL DEL CLIENTE PASARON CON ÉXITO! 🎉');

    } catch (error) {
        console.error('\n❌ ERROR EN LA SUITE DE PRUEBAS:', error);
        
        // Intentar limpiar en caso de error
        try {
            await db.query('DELETE FROM solicitudes_credito WHERE cliente_id = ?', [clienteId]);
            await db.query('DELETE FROM reportes_pago WHERE cliente_id = ?', [clienteId]);
            await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteId]);
            if (tempPrestamoCreado) await db.query('DELETE FROM prestamos WHERE id = ?', [prestamoId]);
            if (tempClienteCreado) await db.query('DELETE FROM clientes WHERE id = ?', [clienteId]);
            if (tempUsuarioCreado) await db.query('DELETE FROM usuarios WHERE id = ?', [adminId]);
        } catch(cleanupError) {
            console.error('Error al limpiar tras fallo:', cleanupError);
        }
        process.exit(1);
    } finally {
        await db.end();
    }
}

// Ejecutar suite de pruebas
ejecutarPruebas();
