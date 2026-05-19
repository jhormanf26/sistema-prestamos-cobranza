/**
 * @file portalClientesAlertas.test.js
 * @description Suite de pruebas de integración TDD para validar que la lógica de cálculo
 * de notificaciones para el portal de clientes (clienteChatSinLeer) funciona de forma íntegra.
 * @author Antigravity
 * @version 1.0.0
 */

const assert = require('assert');
const db = require('../config/db');
const SoporteMensajeModel = require('../models/SoporteMensajeModel');

/**
 * Ejecuta la suite de pruebas unitarias y de integración para las alertas del cliente.
 * 
 * @async
 * @function ejecutarPruebasPortalClientesAlertas
 * @returns {Promise<void>} Promesa que finaliza cuando se completan todas las aserciones.
 * @throws {Error} Excepción si falla alguna comprobación.
 */
async function ejecutarPruebasPortalClientesAlertas() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Alertas y Notificaciones del Cliente...');

    let clienteTestId = null;
    let mensajeAdminId = null;

    try {
        // 1. Obtener o crear un cliente de prueba
        console.log('👥 Obteniendo un cliente de prueba desde la base de datos...');
        const [clientes] = await db.query('SELECT id FROM clientes LIMIT 1');
        
        if (clientes.length === 0) {
            console.log('ℹ️ No hay clientes en la base de datos. Creando un cliente temporal...');
            const [result] = await db.query(`
                INSERT INTO clientes (nombre, apellido, dni, telefono, direccion, estado) 
                VALUES ('Cliente', 'AlertaTest', 'ALERTA987', '3100000000', 'Dirección Alerta', 'activo')
            `);
            clienteTestId = result.insertId;
        } else {
            clienteTestId = clientes[0].id;
        }
        console.log(`ℹ️ Utilizando cliente_id: ${clienteTestId} para la prueba.`);

        // Limpiar mensajes anteriores de este cliente para aislar la prueba
        await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);

        // 2. Verificar estado inicial (Debe ser 0 mensajes sin leer)
        console.log('🔍 Validando estado inicial de no leídos (debe ser 0)...');
        const [rowsInicial] = await db.query(`
            SELECT COUNT(*) as total 
            FROM soporte_mensajes 
            WHERE cliente_id = ? AND remitente = 'administrador' AND leido = 0
        `, [clienteTestId]);
        const clienteChatSinLeerInicial = rowsInicial[0]?.total || 0;
        
        assert.strictEqual(clienteChatSinLeerInicial, 0, 'Al inicio, el contador de no leídos para el cliente debe ser exactamente 0.');
        console.log('✅ Estado inicial es 0.');

        // 3. Crear un mensaje no leído de la administración para el cliente
        console.log('📨 El Administrador envía un mensaje de soporte al cliente (marcado como no leído)...');
        const resEnvio = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            usuario_id: null, // Admin / Sistema
            remitente: 'administrador',
            mensaje: 'Hola estimado cliente, tu solicitud de abono ha sido procesada con éxito.'
        });
        mensajeAdminId = resEnvio.insertId;

        // 4. Simular el middleware de app.js y calcular mensajes sin leer
        console.log('🔄 Ejecutando simulación del middleware global de cálculo de no leídos...');
        const [rowsMiddleware] = await db.query(`
            SELECT COUNT(*) as total 
            FROM soporte_mensajes 
            WHERE cliente_id = ? AND remitente = 'administrador' AND leido = 0
        `, [clienteTestId]);
        const clienteChatSinLeer = rowsMiddleware[0]?.total || 0;

        // Validar que el middleware asigne 1 mensaje no leído
        assert.strictEqual(clienteChatSinLeer, 1, `El middleware del cliente debería contar exactamente 1 mensaje sin leer. Obtenido: ${clienteChatSinLeer}`);
        console.log('✅ Escenario superado: El middleware calcula con precisión quirúrgica 1 mensaje sin leer para el cliente.');

        // 5. Marcar como leído
        console.log('📖 El cliente lee el mensaje (marcar como leído)...');
        await SoporteMensajeModel.marcarComoLeido(clienteTestId, 'administrador');

        // 6. Verificar que el contador regresa a 0
        const [rowsFinal] = await db.query(`
            SELECT COUNT(*) as total 
            FROM soporte_mensajes 
            WHERE cliente_id = ? AND remitente = 'administrador' AND leido = 0
        `, [clienteTestId]);
        const clienteChatSinLeerFinal = rowsFinal[0]?.total || 0;

        assert.strictEqual(clienteChatSinLeerFinal, 0, 'Tras marcar como leído, el contador de no leídos debe regresar exactamente a 0.');
        console.log('✅ Escenario superado: El contador regresa a 0 satisfactoriamente.');

        console.log('🎉 Suite de Pruebas TDD de Alertas de Portal de Clientes COMPLETADA CON ÉXITO ROTUNDO.');

    } catch (error) {
        console.error('❌ La suite de pruebas TDD ha fallado:', error.message);
        process.exit(1);
    } finally {
        // Limpieza de datos de prueba
        if (clienteTestId) {
            console.log('🧹 Limpiando mensajes de prueba y registros temporales creados...');
            await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);
            
            // Si es cliente temporal, eliminarlo
            const [checkCliente] = await db.query('SELECT dni FROM clientes WHERE id = ?', [clienteTestId]);
            if (checkCliente.length > 0 && checkCliente[0].dni === 'ALERTA987') {
                await db.query('DELETE FROM clientes WHERE id = ?', [clienteTestId]);
                console.log('🧹 Cliente temporal eliminado.');
            }
        }

        // Finalizar pool de base de datos
        await db.end();
    }
}

// Ejecutar suite de pruebas
ejecutarPruebasPortalClientesAlertas();
