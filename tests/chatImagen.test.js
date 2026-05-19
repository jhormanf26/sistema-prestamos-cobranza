/**
 * @file chatImagen.test.js
 * @description Suite de pruebas TDD de integración para validar el correcto funcionamiento
 * de la persistencia de imágenes en el chat de soporte, asegurando la adecuada
 * inserción y lectura de la columna 'tipo' (imagen) en soporte_mensajes.
 * @author Antigravity
 * @version 1.0.0
 */

const assert = require('assert');
const db = require('../config/db');
const SoporteMensajeModel = require('../models/SoporteMensajeModel');
const { runMigrations } = require('../config/migrations');

/**
 * Ejecuta la suite de pruebas TDD para verificar el flujo de imágenes en el chat.
 * 
 * @async
 * @function ejecutarPruebasChatImagen
 * @returns {Promise<void>} Promesa que finaliza cuando se completan todas las aserciones.
 * @throws {Error} Excepción si falla alguna comprobación o aserción.
 */
async function ejecutarPruebasChatImagen() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Imágenes en el Chat de Soporte...');

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
                VALUES ('Cliente', 'ImagenTest', 'IMAGEN12345', '3000000003', 'Calle del Espejo 789', 'activo')
            `);
            clienteTestId = result.insertId;
        } else {
            clienteTestId = clientes[0].id;
        }
        console.log(`ℹ️ Utilizando cliente_id: ${clienteTestId} para la prueba.`);

        // Limpiar mensajes anteriores de este cliente para aislar la prueba
        await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);

        // ==========================================
        // ESCENARIO 1: Cliente envía una imagen
        // ==========================================
        console.log('📨 1. Cliente envía una imagen (captura de pantalla)...');
        const rutaImagenCliente = '/uploads/soporte/imagen-123456789-cliente.png';
        const resEnvioCliente = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            remitente: 'cliente',
            mensaje: rutaImagenCliente,
            tipo: 'imagen'
        });
        const mensajeClienteId = resEnvioCliente.insertId;

        // Comprobar BD: El mensaje debe existir y ser de tipo 'imagen'
        const [mensajesInit] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeClienteId]);
        const msgInit = mensajesInit[0];
        assert.ok(msgInit, 'El mensaje del cliente debe existir en la base de datos.');
        assert.strictEqual(msgInit.mensaje, rutaImagenCliente, 'El campo mensaje debe guardar la ruta de la imagen.');
        assert.strictEqual(msgInit.tipo, 'imagen', 'La columna tipo debe estar configurada como "imagen".');
        assert.strictEqual(msgInit.leido, 0, 'El mensaje nuevo debe estar sin leer.');
        console.log('✅ Escenario 1 Superado: La imagen del cliente se guardó con tipo "imagen" y su ruta física.');

        // ==========================================
        // ESCENARIO 2: Administrador responde con imagen
        // ==========================================
        console.log('📨 2. Administrador responde con otra imagen...');
        const rutaImagenAdmin = '/uploads/soporte/imagen-987654321-admin.jpg';
        const resEnvioAdmin = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            usuario_id: null,
            remitente: 'administrador',
            mensaje: rutaImagenAdmin,
            tipo: 'imagen'
        });
        const mensajeAdminId = resEnvioAdmin.insertId;

        // Comprobar BD: El mensaje del admin debe ser de tipo 'imagen'
        const [mensajesAdminInit] = await db.query('SELECT * FROM soporte_mensajes WHERE id = ?', [mensajeAdminId]);
        const msgAdmin = mensajesAdminInit[0];
        assert.ok(msgAdmin, 'El mensaje del administrador debe existir en la base de datos.');
        assert.strictEqual(msgAdmin.mensaje, rutaImagenAdmin, 'El campo mensaje debe guardar la ruta de la imagen del admin.');
        assert.strictEqual(msgAdmin.tipo, 'imagen', 'La columna tipo debe estar configurada como "imagen" para el admin.');
        assert.strictEqual(msgAdmin.remitente, 'administrador', 'El remitente debe ser "administrador".');
        console.log('✅ Escenario 2 Superado: La respuesta del administrador se guardó correctamente con tipo "imagen".');

        // ==========================================
        // ESCENARIO 3: Lectura completa del chat
        // ==========================================
        console.log('📖 3. Recuperando el historial completo del chat para el cliente...');
        const chat = await SoporteMensajeModel.obtenerChatCompleto(clienteTestId);
        
        // Debe haber al menos 2 mensajes
        assert.ok(chat.length >= 2, 'El chat debe contener por lo menos los dos mensajes de imagen inyectados.');
        
        // El mensaje del cliente debe ser tipo imagen y con su ruta
        const msgClienteRecuperado = chat.find(m => m.id === mensajeClienteId);
        assert.ok(msgClienteRecuperado, 'Se debe recuperar el mensaje del cliente en el historial.');
        assert.strictEqual(msgClienteRecuperado.tipo, 'imagen', 'El tipo recuperado debe ser "imagen".');
        assert.strictEqual(msgClienteRecuperado.mensaje, rutaImagenCliente, 'La ruta de la imagen del cliente recuperada debe ser idéntica.');

        // El mensaje del admin debe ser tipo imagen y con su ruta
        const msgAdminRecuperado = chat.find(m => m.id === mensajeAdminId);
        assert.ok(msgAdminRecuperado, 'Se debe recuperar el mensaje del admin en el historial.');
        assert.strictEqual(msgAdminRecuperado.tipo, 'imagen', 'El tipo recuperado debe ser "imagen".');
        assert.strictEqual(msgAdminRecuperado.mensaje, rutaImagenAdmin, 'La ruta de la imagen de admin recuperada debe ser idéntica.');
        
        console.log('✅ Escenario 3 Superado: El historial de chat devuelve las imágenes íntegramente con su metadata.');

        console.log('🎉 Suite de Pruebas TDD de Mensajes de Imagen COMPLETADA CON ÉXITO ROTUNDO.');

    } catch (error) {
        console.error('❌ La suite de pruebas TDD de mensajes de imagen ha fallado:', error);
        process.exit(1);
    } finally {
        // Limpieza final de datos de prueba
        if (clienteTestId) {
            console.log('🧹 Limpiando mensajes de prueba creados...');
            await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);
            
            // Si creamos un cliente temporal, lo eliminamos
            const [checkCliente] = await db.query('SELECT dni FROM clientes WHERE id = ?', [clienteTestId]);
            if (checkCliente.length > 0 && checkCliente[0].dni === 'IMAGEN12345') {
                await db.query('DELETE FROM clientes WHERE id = ?', [clienteTestId]);
                console.log('🧹 Cliente temporal de prueba eliminado.');
            }
        }

        // Cerrar la conexión pool para que finalice el script limpiamente
        await db.end();
    }
}

// Iniciar pruebas
ejecutarPruebasChatImagen();
