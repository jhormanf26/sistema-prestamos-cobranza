/**
 * @file tests/gastos.test.js
 * @description Suite de pruebas de integración para validar la creación, consulta, edición y eliminación de gastos operativos en la base de datos (Enfoque TDD).
 */

const assert = require('assert');
const GastoModel = require('../models/GastoModel');
const db = require('../config/db');

/**
 * Función principal que ejecuta los casos de prueba de integración para el modelo de Gastos.
 * @async
 * @function runTests
 * @returns {Promise<void>}
 */
async function runTests() {
    console.log('🧪 Iniciando pruebas de integración TDD para el modelo GastoModel...');
    let gastoId = null;

    try {
        // 1. Datos iniciales del gasto de prueba
        const datosGastoOriginal = {
            descripcion: 'Gasto de Prueba TDD - Luz Oficina',
            monto: 150000.00,
            categoria: 'Servicios',
            registrado_por: 'Tester AI',
            observacion: 'Gasto temporal para pruebas TDD',
            fecha_gasto: '2026-05-25'
        };

        // 2. Crear gasto
        console.log('ℹ️ Insertando gasto de prueba...');
        const resCrear = await GastoModel.crear(datosGastoOriginal);
        gastoId = resCrear.insertId;
        assert.ok(gastoId, 'El registro del gasto debería devolver un ID de inserción válido.');
        console.log(`✅ Gasto insertado correctamente con ID: ${gastoId}`);

        // 3. Obtener por ID y verificar integridad original
        console.log('ℹ️ Validando lectura de los datos originales del gasto...');
        const gastoLeido = await GastoModel.obtenerPorId(gastoId);
        assert.ok(gastoLeido, 'Se debería poder recuperar el gasto insertado.');
        assert.strictEqual(gastoLeido.descripcion, datosGastoOriginal.descripcion, 'La descripción leída no coincide.');
        assert.strictEqual(parseFloat(gastoLeido.monto), datosGastoOriginal.monto, 'El monto leído no coincide.');
        assert.strictEqual(gastoLeido.categoria, datosGastoOriginal.categoria, 'La categoría leída no coincide.');
        assert.strictEqual(gastoLeido.observacion, datosGastoOriginal.observacion, 'La observación leída no coincide.');
        
        // Formatear la fecha para la aserción de forma robusta
        const dateObj = new Date(gastoLeido.fecha_gasto);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const fechaFormateada = `${year}-${month}-${day}`;
        assert.strictEqual(fechaFormateada, datosGastoOriginal.fecha_gasto, 'La fecha leída no coincide.');
        console.log('✅ Integridad de datos originales validada correctamente.');

        // 4. Datos de actualización
        const datosGastoModificado = {
            descripcion: 'Gasto de Prueba TDD - Agua Oficina Modificado',
            monto: 180000.00,
            categoria: 'Servicios',
            observacion: 'Gasto actualizado en pruebas TDD',
            fecha_gasto: '2026-05-26'
        };

        // 5. Actualizar gasto
        console.log('ℹ️ Actualizando gasto en la base de datos...');
        await GastoModel.actualizar(gastoId, datosGastoModificado);
        console.log('✅ Gasto actualizado.');

        // 6. Obtener por ID y verificar integridad de cambios
        console.log('ℹ️ Validando lectura de los datos modificados del gasto...');
        const gastoModificadoLeido = await GastoModel.obtenerPorId(gastoId);
        assert.ok(gastoModificadoLeido, 'Se debería poder recuperar el gasto modificado.');
        assert.strictEqual(gastoModificadoLeido.descripcion, datosGastoModificado.descripcion, 'La descripción modificada no coincide.');
        assert.strictEqual(parseFloat(gastoModificadoLeido.monto), datosGastoModificado.monto, 'El monto modificado no coincide.');
        assert.strictEqual(gastoModificadoLeido.categoria, datosGastoModificado.categoria, 'La categoría modificada no coincide.');
        assert.strictEqual(gastoModificadoLeido.observacion, datosGastoModificado.observacion, 'La observación modificada no coincide.');
        
        const dateObjMod = new Date(gastoModificadoLeido.fecha_gasto);
        const yearMod = dateObjMod.getFullYear();
        const monthMod = String(dateObjMod.getMonth() + 1).padStart(2, '0');
        const dayMod = String(dateObjMod.getDate()).padStart(2, '0');
        const fechaModFormateada = `${yearMod}-${monthMod}-${dayMod}`;
        assert.strictEqual(fechaModFormateada, datosGastoModificado.fecha_gasto, 'La fecha modificada no coincide.');
        console.log('✅ Integridad de cambios de actualización validada correctamente.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // 7. Limpiar registro temporal
        if (gastoId) {
            console.log(`ℹ️ Limpiando y eliminando gasto de prueba con ID: ${gastoId}...`);
            try {
                await GastoModel.eliminar(gastoId);
                console.log('✅ Base de datos limpiada con éxito.');
            } catch (cleanupError) {
                console.error('⚠️ Error al eliminar el registro de prueba:', cleanupError);
            }
        }
        // Cerrar pool de base de datos
        await db.end();
        console.log('🏁 Pruebas TDD finalizadas.');
    }
}

// Ejecutar pruebas
runTests();
