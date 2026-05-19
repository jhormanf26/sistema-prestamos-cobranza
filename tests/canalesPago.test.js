const assert = require('assert');
const db = require('../config/db');
const ConfigModel = require('../models/ConfigModel');

/**
 * Suite de pruebas TDD para verificar la persistencia y recuperación de los canales de pago (Nequi y Bre-B/Transfiya).
 */
async function ejecutarPruebasCanalesPago() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Canales de Pago Configurables...');

    let configuracionOriginal = null;

    try {
        // 1. Respaldar la configuración actual (si existe) para no alterar datos reales locales
        configuracionOriginal = await ConfigModel.obtener();
        console.log('ℹ️ Configuración actual respaldada.');

        // 2. Definir datos de prueba con canales de pago específicos
        const datosPrueba = {
            nombre_empresa: 'Financiera Nequi-BreB Test S.A.S.',
            ruc: '98765432109',
            direccion: 'Avenida Siempre Viva 742',
            telefono: '3157777777',
            moneda: 'COP$',
            interes_global: 2.0,
            email_contacto: 'contacto.pagos@ejemplo.com',
            alerta_hora: 8,
            modulos_activos: JSON.stringify({
                clientes: true,
                prestamos: true
            }),
            nequi_numero: '3001234567', // Número Nequi personalizado de prueba
            breve_numero: '3119876543'  // Llave Bre-B personalizada de prueba
        };

        // 3. Guardar la configuración de prueba
        console.log('💾 Guardando configuración de prueba con nuevos canales de pago...');
        await ConfigModel.guardar(datosPrueba);

        // 4. Recuperar la configuración guardada y validar los campos
        console.log('🔍 Recuperando configuración guardada desde la base de datos...');
        const configRecuperada = await ConfigModel.obtener();

        assert.ok(configRecuperada, 'La configuración debería haberse recuperado.');
        assert.strictEqual(configRecuperada.nequi_numero, datosPrueba.nequi_numero, 'El número Nequi debería coincidir.');
        assert.strictEqual(configRecuperada.breve_numero, datosPrueba.breve_numero, 'La llave/número Bre-B debería coincidir.');

        console.log('✅ Pruebas TDD de Canales de Pago COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // 5. Restaurar la configuración original si existía
        if (configuracionOriginal) {
            console.log('🔄 Restaurando configuración original de la base de datos...');
            const datosRestaurar = {
                nombre_empresa: configuracionOriginal.nombre_empresa,
                ruc: configuracionOriginal.ruc,
                direccion: configuracionOriginal.direccion,
                telefono: configuracionOriginal.telefono,
                moneda: configuracionOriginal.moneda,
                interes_global: parseFloat(configuracionOriginal.interes_global) || 0,
                logo: configuracionOriginal.logo,
                email_contacto: configuracionOriginal.email_contacto,
                modulos_activos: typeof configuracionOriginal.modulos_activos === 'string' 
                    ? configuracionOriginal.modulos_activos 
                    : JSON.stringify(configuracionOriginal.modulos_activos),
                alerta_hora: configuracionOriginal.alerta_hora,
                push_texto_3d: configuracionOriginal.push_texto_3d,
                push_texto_1d: configuracionOriginal.push_texto_1d,
                push_texto_0d: configuracionOriginal.push_texto_0d,
                nequi_numero: configuracionOriginal.nequi_numero,
                breve_numero: configuracionOriginal.breve_numero
            };
            await ConfigModel.guardar(datosRestaurar);
            console.log('🔄 Configuración original restaurada.');
        }
        
        // Cerrar la conexión para finalizar el test limpiamente
        db.end();
    }
}

ejecutarPruebasCanalesPago();
