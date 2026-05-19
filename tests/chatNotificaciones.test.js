/**
 * @file chatNotificaciones.test.js
 * @description Suite de pruebas TDD de integración para validar el correcto funcionamiento
 * de los contadores e indicadores de mensajes sin leer en el chat de soporte, tanto para la
 * vista de administración como para el portal del cliente.
 * @author Antigravity
 * @version 1.0.0
 */

const assert = require('assert');
const db = require('../config/db');
const SoporteMensajeModel = require('../models/SoporteMensajeModel');

/**
 * Ejecuta la suite de pruebas TDD para verificar los indicadores de no leídos.
 * 
 * @async
 * @function ejecutarPruebasChatNotificaciones
 * @returns {Promise<void>} Promesa que finaliza cuando se completan todas las aserciones.
 * @throws {Error} Excepción si falla alguna comprobación o aserción.
 */
async function ejecutarPruebasChatNotificaciones() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Notificaciones e Indicadores de Chat...');

    let clienteTestId = null;
    let mensajeClienteId = null;
    let mensajeAdminId = null;

    try {
        // 1. Obtener o crear un cliente de prueba para no violar restricciones de integridad referencial
        console.log('👥 Obteniendo un cliente de prueba desde la base de datos...');
        const [clientes] = await db.query('SELECT id FROM clientes LIMIT 1');
        
        if (clientes.length === 0) {
            console.log('ℹ️ No hay clientes en la base de datos. Creando un cliente temporal...');
            const [result] = await db.query(`
                INSERT INTO clientes (nombre, apellido, dni, telefono, direccion, estado) 
                VALUES ('Cliente', 'Prueba', 'TEST123456', '3000000000', 'Dirección', 'activo')
            `);
            clienteTestId = result.insertId;
        } else {
            clienteTestId = clientes[0].id;
        }
        console.log(`ℹ️ Utilizando cliente_id: ${clienteTestId} para la prueba.`);

        // Limpiar mensajes anteriores de este cliente para la prueba
        await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);

        // 2. ESCENARIO 1: El cliente envía un mensaje al Administrador (Debe marcarse como no leído)
        console.log('📨 Cliente envía un mensaje de soporte al administrador...');
        const resEnvioCliente = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            remitente: 'cliente',
            mensaje: 'Hola soporte, tengo una duda con mi cuota'
        });
        mensajeClienteId = resEnvioCliente.insertId;

        // Validar que obtenerChatsActivos devuelva que hay mensajes sin leer
        const chatsActivos = await SoporteMensajeModel.obtenerChatsActivos();
        const miChat = chatsActivos.find(c => c.cliente_id === clienteTestId);
        
        assert.ok(miChat, 'El chat del cliente de prueba debería figurar en la lista de chats activos.');
        assert.ok(miChat.sin_leer > 0, `El chat debe tener mensajes sin leer por parte del admin. Obtenido: ${miChat.sin_leer}`);
        assert.strictEqual(miChat.ultimo_mensaje, 'Hola soporte, tengo una duda con mi cuota', 'El último mensaje del chat debe coincidir.');

        // Comprobar la consulta del middleware del Administrador
        const [rowsAdmin] = await db.query(`
            SELECT COUNT(DISTINCT cliente_id) as total 
            FROM soporte_mensajes 
            WHERE remitente = 'cliente' AND leido = 0
        `);
        const soporteSinLeer = rowsAdmin[0]?.total || 0;
        assert.ok(soporteSinLeer > 0, `El middleware del admin debe contar al menos 1 conversación no leída. Obtenido: ${soporteSinLeer}`);
        console.log(`✅ Escenario 1 Superado: El Administrador detecta el mensaje sin leer del cliente (soporteSinLeer = ${soporteSinLeer}).`);

        // 3. ESCENARIO 2: El Administrador responde al cliente (El mensaje del cliente se lee y se crea uno del admin sin leer por el cliente)
        console.log('📨 El Administrador lee el chat del cliente y le responde...');
        // Marcar mensajes del cliente como leídos por el admin (como lo hace verChatCliente)
        await SoporteMensajeModel.marcarComoLeido(clienteTestId, 'cliente');

        // Enviar respuesta del administrador
        const resEnvioAdmin = await SoporteMensajeModel.enviarMensaje({
            cliente_id: clienteTestId,
            usuario_id: null, // Sistema / Admin
            remitente: 'administrador',
            mensaje: 'Hola, con gusto. ¿Cuál es tu número de cédula?'
        });
        mensajeAdminId = resEnvioAdmin.insertId;

        // Comprobar que el admin ya no tiene mensajes sin leer del cliente
        const chatsActivosPostResp = await SoporteMensajeModel.obtenerChatsActivos();
        const miChatPostResp = chatsActivosPostResp.find(c => c.cliente_id === clienteTestId);
        assert.strictEqual(miChatPostResp ? miChatPostResp.sin_leer : 0, 0, 'El administrador ya no debería tener mensajes sin leer para este cliente.');

        // Comprobar la consulta del middleware del Cliente (mensajes sin leer del admin)
        const [rowsCliente] = await db.query(`
            SELECT COUNT(*) as total 
            FROM soporte_mensajes 
            WHERE cliente_id = ? AND remitente = 'administrador' AND leido = 0
        `, [clienteTestId]);
        const clienteChatSinLeer = rowsCliente[0]?.total || 0;
        assert.ok(clienteChatSinLeer > 0, `El middleware del cliente debe detectar la respuesta no leída del admin. Obtenido: ${clienteChatSinLeer}`);
        console.log(`✅ Escenario 2 Superado: El Cliente detecta la respuesta sin leer del administrador (clienteChatSinLeer = ${clienteChatSinLeer}).`);

        // 4. ESCENARIO 3: El cliente abre su chat y los mensajes se marcan como leídos
        console.log('📖 El cliente abre el chat y lee la respuesta...');
        await SoporteMensajeModel.marcarComoLeido(clienteTestId, 'administrador');

        // Validar que el contador de no leídos del cliente regrese a 0
        const [rowsClienteFinal] = await db.query(`
            SELECT COUNT(*) as total 
            FROM soporte_mensajes 
            WHERE cliente_id = ? AND remitente = 'administrador' AND leido = 0
        `, [clienteTestId]);
        const clienteChatSinLeerFinal = rowsClienteFinal[0]?.total || 0;
        assert.strictEqual(clienteChatSinLeerFinal, 0, 'El contador de mensajes sin leer del cliente debe ser 0 después de marcar como leído.');
        console.log('✅ Escenario 3 Superado: El contador de no leídos regresa a 0 tras abrir la conversación.');

        console.log('🎉 Suite de Pruebas TDD de Notificaciones de Chat COMPLETADA CON ÉXITO ROTUNDO.');

    } catch (error) {
        console.error('❌ La suite de pruebas TDD de notificaciones de chat ha fallado:', error);
        process.exit(1);
    } finally {
        // Limpieza final de datos de prueba
        if (clienteTestId) {
            console.log('🧹 Limpiando mensajes y registros de prueba creados...');
            await db.query('DELETE FROM soporte_mensajes WHERE cliente_id = ?', [clienteTestId]);
            
            // Si creamos un cliente temporal, lo eliminamos
            const [checkCliente] = await db.query('SELECT dni FROM clientes WHERE id = ?', [clienteTestId]);
            if (checkCliente.length > 0 && checkCliente[0].dni === 'TEST123456') {
                await db.query('DELETE FROM clientes WHERE id = ?', [clienteTestId]);
                console.log('🧹 Cliente temporal de prueba eliminado.');
            }
        }

        // Cerrar la conexión pool para que finalice el script limpiamente
        await db.end();
    }
}

// Iniciar pruebas
ejecutarPruebasChatNotificaciones();
