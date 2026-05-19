/**
 * @file chatVisto.test.js
 * @description Suite de pruebas TDD de integración para validar el correcto funcionamiento
 * de los estados de mensajes ("Enviado", "Entregado" y "Visto") en el chat de soporte,
 * asegurando la persistencia adecuada de las marcas de tiempo.
 * @author Antigravity
 * @version 1.0.0
 */

const assert = require('assert');
const db = require('../config/db');
const SoporteMensajeModel = require('../models/SoporteMensajeModel');
const { runMigrations } = require('../config/migrations');

/**
 * Ejecuta la suite de pruebas TDD para verificar el flujo de estados de mensajes.
 * 
 * @async
 * @function ejecutarPruebasChatVisto
 * @returns {Promise<void>} Promesa que finaliza cuando se completan todas las aserciones.
 * @throws {Error} Excepción si falla alguna comprobación o aserción.
 */
async function ejecutarPruebasChatVisto() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Ticks de Estado (Enviado, Entregado, Visto) en el Chat...');

    try {
        console.log('⚙️ Ejecutando migraciones de base de datos antes de iniciar...');
        await runMigrations();
        console.log('✅ Migraciones completadas.');
    } catch (migError) {
        console.error('⚠️ Error al correr migraciones en el test:', migError.message);
    }

    let clienteTestId = null;

    try {
        // 1. Obtener o crear un cliente de prueba
        console.log('👥 Obteniendo un cliente de prueba desde la base de datos...');
        const [clientes] = await db.query('SELECT id FROM clientes LIMIT 1');
        
        if (clientes.length === 0) {
            console.log('ℹ️ No hay clientes en la base de datos. Creando un cliente temporal...');
            const [result] = await db.query(`
                INSERT INTO clientes (nombre, apellido, dni, telefono, direccion, estado) 
                VALUES ('Cliente', 'VistoTest', 'VISTO12345', '3000000001', 'Calle Falsa 123', 'activo')
            `);
            clienteTestId = result.insertId;
        } else {
            clienteTestId = clientes[0].id;
        }
        console.log(`ℹ️ Utilizando cliente_id: ${clienteTestId} para la prueba.`);

        // Limpiar mensajes anteriores de este cliente para aislar la prueba
        await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);

        // ==========================================
        // FLUJO 1: Mensajes del Cliente al Administrador
        // ==========================================

        // Escenario 1: El cliente envía un mensaje
        console.log('📨 1. Cliente envía mensaje. Debe quedar en estado ENVIADO...');
        const resEnvioCliente = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            remitente: 'cliente',
            mensaje: 'Mensaje de prueba del cliente para validar visto'
        });
        const mensajeClienteId = resEnvioCliente.insertId;

        // Comprobar BD: fecha_entregado y fecha_visto deben ser NULL
        const [mensajesInit] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeClienteId]);
        const msgInit = mensajesInit[0];
        assert.ok(msgInit, 'El mensaje del cliente debe existir en la base de datos.');
        assert.strictEqual(msgInit.fecha_entregado, null, 'Un mensaje recién enviado no debe tener fecha_entregado.');
        assert.strictEqual(msgInit.fecha_visto, null, 'Un mensaje recién enviado no debe tener fecha_visto.');
        console.log('✅ Escenario 1 Superado: El mensaje del cliente inicia como "Enviado" (Timestamps NULL).');

        // Escenario 2: El administrador consulta los chats activos (inbox)
        console.log('📬 2. Administrador consulta chats activos. El mensaje debe marcarse como ENTREGADO...');
        await SoporteMensajeModel.obtenerChatsActivos();

        // Comprobar BD: fecha_entregado debe haberse llenado, fecha_visto debe seguir siendo NULL
        const [mensajesEntregado] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeClienteId]);
        const msgEntregado = mensajesEntregado[0];
        assert.ok(msgEntregado.fecha_entregado !== null, 'El mensaje debe haberse marcado como entregado (fecha_entregado NOT NULL).');
        assert.strictEqual(msgEntregado.fecha_visto, null, 'El mensaje entregado no debe tener fecha_visto aún.');
        console.log('✅ Escenario 2 Superado: El mensaje cambia automáticamente a "Entregado" al consultar la bandeja.');

        // Escenario 3: El administrador abre el chat y lee el mensaje
        console.log('📖 3. Administrador abre la conversación. El mensaje debe marcarse como VISTO...');
        await SoporteMensajeModel.marcarComoLeido(clienteTestId, 'cliente');

        // Comprobar BD: fecha_visto debe haberse llenado
        const [mensajesVisto] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeClienteId]);
        const msgVisto = mensajesVisto[0];
        assert.ok(msgVisto.fecha_visto !== null, 'El mensaje debe haberse marcado como visto (fecha_visto NOT NULL).');
        assert.strictEqual(msgVisto.leido, 1, 'El mensaje debe tener leido = 1.');
        console.log('✅ Escenario 3 Superado: El mensaje del cliente cambia a "Visto/Leído" al abrir el chat el admin.');


        // ==========================================
        // FLUJO 2: Mensajes del Administrador al Cliente
        // ==========================================

        // Escenario 4: El administrador envía una respuesta
        console.log('📨 4. Administrador envía mensaje. Debe quedar en estado ENVIADO...');
        const resEnvioAdmin = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            usuario_id: null,
            remitente: 'administrador',
            mensaje: 'Respuesta del administrador para validar visto'
        });
        const mensajeAdminId = resEnvioAdmin.insertId;

        // Comprobar BD: fecha_entregado y fecha_visto deben ser NULL
        const [mensajesAdminInit] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeAdminId]);
        const msgAdminInit = mensajesAdminInit[0];
        assert.strictEqual(msgAdminInit.fecha_entregado, null, 'El mensaje del admin recién enviado no debe tener fecha_entregado.');
        assert.strictEqual(msgAdminInit.fecha_visto, null, 'El mensaje del admin recién enviado no debe tener fecha_visto.');
        console.log('✅ Escenario 4 Superado: El mensaje del administrador inicia como "Enviado" (Timestamps NULL).');

        // Escenario 5: El cliente hace polling de estado / entra al portal (sin abrir directamente el chat pero estando en él / recibiendo actualizaciones silenciosas)
        console.log('📬 5. Cliente hace polling de actualizaciones. El mensaje del admin debe marcarse como ENTREGADO...');
        await SoporteMensajeModel.marcarComoEntregado(clienteTestId, 'administrador');

        // Comprobar BD: fecha_entregado debe haberse llenado, fecha_visto en NULL
        const [mensajesAdminEntregado] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeAdminId]);
        const msgAdminEntregado = mensajesAdminEntregado[0];
        assert.ok(msgAdminEntregado.fecha_entregado !== null, 'El mensaje del admin debe haberse marcado como entregado.');
        assert.strictEqual(msgAdminEntregado.fecha_visto, null, 'El mensaje del admin entregado no debe tener fecha_visto aún.');
        console.log('✅ Escenario 5 Superado: El mensaje del admin cambia a "Entregado" al recibirlo en el cliente.');

        // Escenario 6: El cliente abre el chat y lee la respuesta
        console.log('📖 6. Cliente abre la conversación. El mensaje debe marcarse como VISTO...');
        await SoporteMensajeModel.marcarComoLeido(clienteTestId, 'administrador');

        // Comprobar BD: fecha_visto debe haberse llenado
        const [mensajesAdminVisto] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeAdminId]);
        const msgAdminVisto = mensajesAdminVisto[0];
        assert.ok(msgAdminVisto.fecha_visto !== null, 'El mensaje del admin debe haberse marcado como visto.');
        assert.strictEqual(msgAdminVisto.leido, 1, 'El mensaje del admin debe tener leido = 1.');
        console.log('✅ Escenario 6 Superado: El mensaje del admin cambia a "Visto/Leído" al abrirlo el cliente.');

        console.log('🎉 Suite de Pruebas TDD de Visto de Chat COMPLETADA CON ÉXITO ROTUNDO.');

    } catch (error) {
        console.error('❌ La suite de pruebas TDD de visto de chat ha fallado:', error);
        process.exit(1);
    } finally {
        // Limpieza final de datos de prueba
        if (clienteTestId) {
            console.log('🧹 Limpiando mensajes y registros de prueba creados...');
            await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);
            
            // Si creamos un cliente temporal, lo eliminamos
            const [checkCliente] = await db.query('SELECT dni FROM clientes WHERE id = ?', [clienteTestId]);
            if (checkCliente.length > 0 && checkCliente[0].dni === 'VISTO12345') {
                await db.query('DELETE FROM clientes WHERE id = ?', [clienteTestId]);
                console.log('🧹 Cliente temporal de prueba eliminado.');
            }
        }

        // Cerrar la conexión pool para que finalice el script limpiamente
        await db.end();
    }
}

// Iniciar pruebas
ejecutarPruebasChatVisto();
