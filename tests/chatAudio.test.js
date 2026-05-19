/**
 * @file chatAudio.test.js
 * @description Suite de pruebas TDD de integración para validar el correcto funcionamiento
 * de la persistencia de mensajes de audio (notas de voz) en el chat de soporte,
 * asegurando la adecuada inserción y lectura de la columna 'tipo' (audio) en soporte_mensajes.
 * @author Antigravity
 * @version 1.0.0
 */

const assert = require('assert');
const db = require('../config/db');
const SoporteMensajeModel = require('../models/SoporteMensajeModel');
const { runMigrations } = require('../config/migrations');

/**
 * Ejecuta la suite de pruebas TDD para verificar el flujo de mensajes de audio.
 * 
 * @async
 * @function ejecutarPruebasChatAudio
 * @returns {Promise<void>} Promesa que finaliza cuando se completan todas las aserciones.
 * @throws {Error} Excepción si falla alguna comprobación o aserción.
 */
async function ejecutarPruebasChatAudio() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Notas de Voz (Mensajes de Audio) en el Chat...');

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
                VALUES ('Cliente', 'AudioTest', 'AUDIO12345', '3000000002', 'Calle de las Ondas 456', 'activo')
            `);
            clienteTestId = result.insertId;
        } else {
            clienteTestId = clientes[0].id;
        }
        console.log(`ℹ️ Utilizando cliente_id: ${clienteTestId} para la prueba.`);

        // Limpiar mensajes anteriores de este cliente para aislar la prueba
        await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);

        // ==========================================
        // ESCENARIO 1: Cliente envía un audio
        // ==========================================
        console.log('📨 1. Cliente envía una nota de voz...');
        const rutaAudioCliente = '/uploads/soporte/audio-123456789-cliente.webm';
        const resEnvioCliente = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            remitente: 'cliente',
            mensaje: rutaAudioCliente,
            tipo: 'audio'
        });
        const mensajeClienteId = resEnvioCliente.insertId;

        // Comprobar BD: El mensaje debe existir y ser de tipo 'audio'
        const [mensajesInit] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeClienteId]);
        const msgInit = mensajesInit[0];
        assert.ok(msgInit, 'El mensaje del cliente debe existir en la base de datos.');
        assert.strictEqual(msgInit.mensaje, rutaAudioCliente, 'El campo mensaje debe guardar la ruta del archivo de audio.');
        assert.strictEqual(msgInit.tipo, 'audio', 'La columna tipo debe estar configurada como "audio".');
        assert.strictEqual(msgInit.leido, 0, 'El mensaje nuevo debe estar sin leer.');
        console.log('✅ Escenario 1 Superado: La nota de voz del cliente se guardó con tipo "audio" y su ruta física.');

        // ==========================================
        // ESCENARIO 2: Administrador responde con audio
        // ==========================================
        console.log('📨 2. Administrador responde con otra nota de voz...');
        const rutaAudioAdmin = '/uploads/soporte/audio-987654321-admin.mp3';
        const resEnvioAdmin = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            usuario_id: null, // Asumimos nulo o id de usuario válido
            remitente: 'administrador',
            mensaje: rutaAudioAdmin,
            tipo: 'audio'
        });
        const mensajeAdminId = resEnvioAdmin.insertId;

        // Comprobar BD: El mensaje del admin debe ser de tipo 'audio'
        const [mensajesAdminInit] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeAdminId]);
        const msgAdmin = mensajesAdminInit[0];
        assert.ok(msgAdmin, 'El mensaje del administrador debe existir en la base de datos.');
        assert.strictEqual(msgAdmin.mensaje, rutaAudioAdmin, 'El campo mensaje debe guardar la ruta del audio del admin.');
        assert.strictEqual(msgAdmin.tipo, 'audio', 'La columna tipo debe estar configurada como "audio" para el admin.');
        assert.strictEqual(msgAdmin.remitente, 'administrador', 'El remitente debe ser "administrador".');
        console.log('✅ Escenario 2 Superado: La respuesta del administrador se guardó correctamente con tipo "audio".');

        // ==========================================
        // ESCENARIO 3: Lectura completa del chat
        // ==========================================
        console.log('📖 3. Recuperando el historial completo del chat para el cliente...');
        const chat = await SoporteMensajeModel.obtenerChatCompleto(clienteTestId);
        
        // Debe haber al menos 2 mensajes
        assert.ok(chat.length >= 2, 'El chat debe contener por lo menos los dos mensajes de audio inyectados.');
        
        // El primer mensaje debe ser del cliente y tipo audio
        const msgClienteRecuperado = chat.find(m => m.id === mensajeClienteId);
        assert.ok(msgClienteRecuperado, 'Se debe recuperar el mensaje del cliente en el historial.');
        assert.strictEqual(msgClienteRecuperado.tipo, 'audio', 'El tipo recuperado debe ser "audio".');
        assert.strictEqual(msgClienteRecuperado.mensaje, rutaAudioCliente, 'La ruta del audio recuperada debe ser idéntica.');

        // El segundo mensaje debe ser del admin y tipo audio
        const msgAdminRecuperado = chat.find(m => m.id === mensajeAdminId);
        assert.ok(msgAdminRecuperado, 'Se debe recuperar el mensaje del admin en el historial.');
        assert.strictEqual(msgAdminRecuperado.tipo, 'audio', 'El tipo recuperado debe ser "audio".');
        assert.strictEqual(msgAdminRecuperado.mensaje, rutaAudioAdmin, 'La ruta del audio de admin recuperada debe ser idéntica.');
        
        console.log('✅ Escenario 3 Superado: El historial de chat devuelve los audios íntegramente con su metadata.');

        console.log('🎉 Suite de Pruebas TDD de Mensajes de Audio COMPLETADA CON ÉXITO ROTUNDO.');

    } catch (error) {
        console.error('❌ La suite de pruebas TDD de mensajes de audio ha fallado:', error);
        process.exit(1);
    } finally {
        // Limpieza final de datos de prueba
        if (clienteTestId) {
            console.log('🧹 Limpiando mensajes de prueba creados...');
            await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);
            
            // Si creamos un cliente temporal, lo eliminamos
            const [checkCliente] = await db.query('SELECT dni FROM clientes WHERE id = ?', [clienteTestId]);
            if (checkCliente.length > 0 && checkCliente[0].dni === 'AUDIO12345') {
                await db.query('DELETE FROM clientes WHERE id = ?', [clienteTestId]);
                console.log('🧹 Cliente temporal de prueba eliminado.');
            }
        }

        // Cerrar la conexión pool para que finalice el script limpiamente
        await db.end();
    }
}

// Iniciar pruebas
ejecutarPruebasChatAudio();
