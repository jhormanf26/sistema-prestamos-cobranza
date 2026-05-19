const assert = require('assert');
const db = require('../config/db');
const ConfigModel = require('../models/ConfigModel');

/**
 * Suite de pruebas TDD para verificar la persistencia y recuperación de los nuevos módulos configurables en configuracion.
 */
async function ejecutarPruebasConfig() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Configuración Dinámica de Módulos...');

    let configuracionOriginal = null;

    try {
        // 1. Respaldar la configuración actual (si existe) para no alterar datos de producción locales
        configuracionOriginal = await ConfigModel.obtener();
        console.log('ℹ️ Configuración actual respaldada.');

        // 2. Definir datos de prueba con los nuevos módulos
        const datosPrueba = {
            nombre_empresa: 'Empresa Test TDD S.A.S.',
            ruc: '12345678901',
            direccion: 'Calle Falsa 123',
            telefono: '555-5555',
            moneda: 'COP$',
            interes_global: 5.5,
            email_contacto: 'contacto.test@ejemplo.com',
            alerta_hora: 9,
            modulos_activos: JSON.stringify({
                clientes: true,
                prestamos: true,
                simulador: false,
                gastos: true,
                reportes: false,
                empenos: true,
                ahorros: false,
                cadenas: true,
                promocion: false,
                comprobantes: true,      // Nuevo módulo TDD
                solicitudes: false,      // Nuevo módulo TDD
                soporte: true            // Nuevo módulo TDD
            })
        };

        // 3. Guardar la configuración de prueba
        console.log('💾 Guardando configuración de prueba con nuevos módulos activos...');
        await ConfigModel.guardar(datosPrueba);

        // 4. Recuperar la configuración guardada y validar los campos
        console.log('🔍 Recuperando configuración guardada desde la base de datos...');
        const configRecuperada = await ConfigModel.obtener();

        assert.ok(configRecuperada, 'La configuración debería haberse recuperado.');
        assert.strictEqual(configRecuperada.nombre_empresa, datosPrueba.nombre_empresa, 'El nombre de la empresa debería coincidir.');
        assert.ok(configRecuperada.modulos_activos, 'El campo modulos_activos debería estar presente.');

        // Parsear modulos_activos
        const modulos = typeof configRecuperada.modulos_activos === 'string' 
            ? JSON.parse(configRecuperada.modulos_activos) 
            : configRecuperada.modulos_activos;

        console.log('📋 Módulos recuperados en la prueba:', modulos);

        // Validaciones estrictas de los nuevos módulos añadidos
        assert.strictEqual(modulos.comprobantes, true, 'El módulo comprobantes debería estar guardado como true.');
        assert.strictEqual(modulos.solicitudes, false, 'El módulo solicitudes debería estar guardado como false.');
        assert.strictEqual(modulos.soporte, true, 'El módulo soporte debería estar guardado como true.');

        console.log('✅ Pruebas TDD de Configuración Dinámica de Módulos COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // 5. Restaurar la configuración original si existía
        if (configuracionOriginal) {
            console.log('🔄 Restaurando configuración original de la base de datos...');
            // Sanitizar objeto para evitar problemas de persistencia
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
                push_texto_0d: configuracionOriginal.push_texto_0d
            };
            await ConfigModel.guardar(datosRestaurar);
            console.log('🔄 Configuración original restaurada.');
        }
        
        // Cerrar la conexión para finalizar el test limpiamente
        db.end();
    }
}

ejecutarPruebasConfig();
