const assert = require('assert');
const AhorroModel = require('../models/AhorroModel');
const db = require('../config/db');

/**
 * Suite de pruebas para verificar la actualización de la meta de ahorro en la base de datos.
 */
async function testActualizarMeta() {
    console.log('🧪 Iniciando pruebas de AhorroModel.actualizarMeta...');

    try {
        const cuentas = await AhorroModel.obtenerTodas();
        
        if (cuentas.length === 0) {
            console.log('ℹ️ No hay cuentas de ahorro creadas en la base de datos. Creando una temporal...');
            // Buscamos un cliente para crear la cuenta
            const [clientes] = await db.query('SELECT id FROM clientes LIMIT 1');
            if (clientes.length === 0) {
                console.log('⚠️ No hay clientes registrados para realizar la prueba con BD. Omitiendo prueba física.');
                return;
            }
            const clienteId = clientes[0].id;
            const resCrear = await AhorroModel.crear(clienteId, null, null);
            const cuentaId = resCrear.insertId;

            // Ejecutamos actualización de prueba
            await AhorroModel.actualizarMeta(cuentaId, 500000, 'Test de Ahorro Nuevo');
            
            // Verificar
            const cuentaVerif = await AhorroModel.obtenerPorId(cuentaId);
            assert.strictEqual(parseInt(cuentaVerif.meta_monto), 500000, 'El monto de la meta debe ser 500.000');
            assert.strictEqual(cuentaVerif.meta_nombre, 'Test de Ahorro Nuevo', 'El nombre de la meta debe ser "Test de Ahorro Nuevo"');

            // Limpiar cuenta temporal
            await db.query('DELETE FROM cuentas_ahorro WHERE id = ?', [cuentaId]);
            console.log('✅ Cuenta temporal creada, testeada y eliminada con éxito.');
        } else {
            // Testear sobre una cuenta existente sin alterar sus datos permanentes
            const cuentaOriginal = cuentas[0];
            const cuentaId = cuentaOriginal.id;
            const originalMonto = cuentaOriginal.meta_monto;
            const originalNombre = cuentaOriginal.meta_nombre;

            console.log(`ℹ️ Testeando sobre cuenta existente #${cuentaId} del cliente ${cuentaOriginal.nombre}...`);

            // 1. Actualizar a valores de prueba
            const testMonto = 750000;
            const testNombre = 'Test TDD Viaje';
            await AhorroModel.actualizarMeta(cuentaId, testMonto, testNombre);

            // 2. Verificar los cambios en la BD
            const cuentaModificada = await AhorroModel.obtenerPorId(cuentaId);
            assert.strictEqual(parseInt(cuentaModificada.meta_monto), testMonto, 'El monto modificado no coincide');
            assert.strictEqual(cuentaModificada.meta_nombre, testNombre, 'El nombre modificado no coincide');

            // 3. Restaurar los valores originales
            await AhorroModel.actualizarMeta(cuentaId, originalMonto, originalNombre);

            // 4. Confirmar restauración
            const cuentaRestaurada = await AhorroModel.obtenerPorId(cuentaId);
            assert.strictEqual(cuentaRestaurada.meta_monto, originalMonto, 'El monto no fue restaurado correctamente');
            assert.strictEqual(cuentaRestaurada.meta_nombre, originalNombre, 'El nombre no fue restaurado correctamente');

            console.log('✅ Prueba de actualización y restauración finalizada con éxito.');
        }

        console.log('✅ Todas las pruebas de AhorroModel.actualizarMeta pasaron correctamente.');
    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
        process.exit(1);
    } finally {
        // Cerrar pool de base de datos para finalizar la ejecución
        await db.end();
    }
}

// Ejecutar
testActualizarMeta();
