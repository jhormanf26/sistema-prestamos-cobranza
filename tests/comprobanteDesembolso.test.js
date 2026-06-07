const assert = require('assert');
const db = require('../config/db');
const PrestamoModel = require('../models/PrestamoModel');

/**
 * Suite de pruebas TDD para verificar el registro y recuperación de la evidencia de desembolso.
 */
async function ejecutarPruebasDesembolso() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Evidencia de Desembolso...');

    try {
        // 1. Obtener un préstamo existente de prueba
        const [prestamos] = await db.query('SELECT id, comprobante_desembolso, notas_desembolso FROM prestamos LIMIT 1');
        if (prestamos.length === 0) {
            console.log('⚠️ No hay préstamos registrados en la BD. Saltando prueba.');
            process.exit(0);
        }

        const prestamoOriginal = prestamos[0];
        const idPrestamo = prestamoOriginal.id;
        console.log(`ℹ️ Utilizando Préstamo de prueba ID: ${idPrestamo}`);

        // 2. Definir datos de prueba para desembolso
        const compPrueba = 'test-desembolso-123.png';
        const notasPrueba = 'Se pagó mediante transferencia por Nequi del banco de pruebas.';

        // 3. Registrar la evidencia
        console.log('💾 Guardando evidencia de desembolso en base de datos...');
        await PrestamoModel.guardarDesembolso(idPrestamo, compPrueba, notasPrueba);

        // 4. Recuperar y verificar que los datos coincidan
        console.log('🔍 Validando persistencia de los datos...');
        const prestamoRecuperado = await PrestamoModel.obtenerPorId(idPrestamo);

        assert.strictEqual(prestamoRecuperado.comprobante_desembolso, compPrueba, 'El nombre del archivo de comprobante no coincide.');
        assert.strictEqual(prestamoRecuperado.notas_desembolso, notasPrueba, 'Las notas de desembolso no coinciden.');

        // 5. Restaurar el estado original del préstamo para no dejar datos sucios en el entorno local
        console.log('🔄 Restaurando valores originales del préstamo de prueba...');
        await PrestamoModel.guardarDesembolso(idPrestamo, prestamoOriginal.comprobante_desembolso, prestamoOriginal.notas_desembolso);

        console.log('✅ Pruebas TDD de Evidencia de Desembolso COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // Cerrar conexión limpia
        db.end();
    }
}

ejecutarPruebasDesembolso();
