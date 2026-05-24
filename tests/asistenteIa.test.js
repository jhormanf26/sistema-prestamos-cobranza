const assert = require('assert');
const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const ConfigModel = require('../models/ConfigModel');
const groqService = require('../services/groqService');
const portalClienteController = require('../controllers/portalClienteController');

/**
 * Suite de pruebas TDD para verificar el Asistente de IA (Chatbot).
 */
async function ejecutarPruebasAsistenteIA() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para el Asistente de IA (Chatbot)...');

    const dniPrueba = '9999999999';
    let clientePruebaId = null;

    // Guardar referencia original del servicio de Groq
    const enviarMensajeChatOriginal = groqService.enviarMensajeChat;

    try {
        // 1. Limpieza preventiva
        await db.query('DELETE FROM clientes WHERE DNI = ?', [dniPrueba]);

        // 2. Crear cliente de prueba
        console.log('👤 Creando cliente de prueba...');
        await ClienteModel.crear({
            dni: dniPrueba,
            nombre: 'Juan',
            apellido: 'Bot Test',
            telefono: '3150000000',
            direccion: 'Calle Falsa 123',
            email: 'bot.test@ejemplo.com',
            monto_preaprobado: 5000000
        });

        // Buscar el cliente creado para obtener su ID
        const clientePrueba = await ClienteModel.buscarPorDNI(dniPrueba);
        clientePruebaId = clientePrueba.id;
        assert.ok(clientePruebaId, 'El cliente de prueba debería haberse creado.');

        // 3. Validar comportamiento del servicio de Groq sin API Key (debe arrojar error)
        console.log('🔒 Validando que el servicio de Groq falle sin API Key válida...');
        const originalApiKey = process.env.GROQ_API_KEY;
        
        // Simular que no hay API key
        process.env.GROQ_API_KEY = '';
        
        await assert.rejects(
            async () => {
                await groqService.enviarMensajeChat([{ role: 'user', content: 'Hola' }]);
            },
            /La API Key de Groq no está configurada/,
            'El servicio debería fallar si la API Key no está configurada.'
        );
        
        // Restaurar API Key en env
        process.env.GROQ_API_KEY = originalApiKey;
        console.log('✅ Validación de seguridad de API Key exitosa.');

        // 4. Mockear el servicio de Groq para probar el controlador de forma aislada
        console.log('🛠️ Mockeando el servicio de Groq para pruebas del controlador...');
        
        let promptRecibido = null;
        
        groqService.enviarMensajeChat = async (mensajes) => {
            // Guardamos el prompt del sistema enviado para validación
            promptRecibido = mensajes.find(m => m.role === 'system').content;
            return 'Hola Juan Bot Test, soy tu asistente financiero. Tu saldo actual en el sistema es de $ 0 COP.';
        };

        // 5. Simular petición POST al controlador de chat del asistente
        console.log('📡 Simulando petición al endpoint del chatbot del cliente...');
        
        const req = {
            session: {
                cliente: {
                    id: clientePruebaId,
                    nombre: 'Juan',
                    apellido: 'Bot Test',
                    dni: dniPrueba
                }
            },
            body: {
                mensajes: [
                    { role: 'user', content: '¿Cuánto dinero tengo en mi cuenta?' }
                ]
            }
        };

        let responseJson = null;
        let responseStatus = null;

        const res = {
            status: function(code) {
                responseStatus = code;
                return this;
            },
            json: function(data) {
                responseJson = data;
                return this;
            }
        };

        // Ejecutar el método del controlador
        await portalClienteController.chatAsistenteIA(req, res);

        // 6. Validar respuestas y contexto inyectado
        assert.ok(responseJson, 'Debería haber una respuesta JSON.');
        assert.strictEqual(responseJson.success, true, 'La respuesta debería ser exitosa.');
        assert.ok(responseJson.response, 'Debería contener una respuesta de texto.');
        assert.ok(responseJson.response.includes('Juan Bot Test'), 'La respuesta simulada de la IA debería ser devuelta.');

        // Validar que se inyectó el contexto esperado en el System Prompt
        assert.ok(promptRecibido, 'El System Prompt de contexto debería haber sido enviado al servicio de Groq.');
        assert.ok(promptRecibido.includes('Juan Bot Test'), 'El prompt de sistema debería contener el nombre del cliente.');
        assert.ok(promptRecibido.includes(dniPrueba), 'El prompt de sistema debería contener el DNI del cliente.');
        assert.ok(promptRecibido.includes('Monto Máximo Pre-aprobado'), 'El prompt de sistema debería contener la información del cupo pre-aprobado.');
        assert.ok(promptRecibido.includes('Firma Digital Contrato'), 'El prompt de sistema debería contener el estado de la firma digital del contrato.');
        console.log('✅ Respuestas del controlador y contexto inyectado validados con éxito.');
        console.log('🎉 Pruebas TDD del Asistente de IA COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD del Asistente de IA:', error);
        process.exit(1);
    } finally {
        // Restaurar función original
        groqService.enviarMensajeChat = enviarMensajeChatOriginal;

        // Limpiar cliente de prueba
        if (clientePruebaId) {
            console.log('🧹 Limpiando base de datos (eliminando cliente de prueba)...');
            await db.query('DELETE FROM clientes WHERE id = ?', [clientePruebaId]);
        }

        // Cerrar conexión
        db.end();
    }
}

ejecutarPruebasAsistenteIA();
