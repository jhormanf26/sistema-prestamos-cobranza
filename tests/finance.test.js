const assert = require('assert');
const finance = require('../utils/finance');

/**
 * Suite de pruebas para verificar la lógica de cálculo de la próxima cuota.
 */
function testObtenerProximaCuota() {
    console.log('🧪 Iniciando pruebas de finance.obtenerProximaCuota...');

    const montoTotal = 100000; // $100.000
    const cuotas = 4;
    const frecuencia = 'mensual';
    const fechaInicio = '2026-05-19';

    // Caso 1: Sin pagos realizados -> La próxima cuota debe ser la #1
    let result = finance.obtenerProximaCuota(montoTotal, cuotas, frecuencia, fechaInicio, 0);
    assert.ok(result, 'Debe devolver una cuota');
    assert.strictEqual(result.numero, 1, 'La primera cuota pendiente debe ser la #1');
    assert.strictEqual(result.monto, 25000, 'El monto de la cuota debe ser $25.000');
    assert.strictEqual(result.restante, 25000, 'El restante debe ser $25.000 ya que no hay pagos');

    // Caso 2: Un pago parcial menor a la cuota ($10.000 de $25.000) -> Sigue siendo la #1 con restante de $15.000
    result = finance.obtenerProximaCuota(montoTotal, cuotas, frecuencia, fechaInicio, 10000);
    assert.ok(result, 'Debe devolver una cuota');
    assert.strictEqual(result.numero, 1, 'Sigue siendo la cuota #1');
    assert.strictEqual(result.restante, 15000, 'El saldo restante debe ser $15.000');

    // Caso 3: Un pago que cubre exactamente la primera cuota ($25.000) -> Próxima cuota debe ser la #2
    result = finance.obtenerProximaCuota(montoTotal, cuotas, frecuencia, fechaInicio, 25000);
    assert.ok(result, 'Debe devolver una cuota');
    assert.strictEqual(result.numero, 2, 'La próxima cuota debe ser la #2');
    assert.strictEqual(result.restante, 25000, 'El restante de la cuota #2 debe ser completo ($25.000)');

    // Caso 4: Pago de $60.000 (Cubre cuota #1 y #2, y sobra $10.000 para la cuota #3) -> Próxima cuota debe ser la #3 con restante de $15.000
    result = finance.obtenerProximaCuota(montoTotal, cuotas, frecuencia, fechaInicio, 60000);
    assert.ok(result, 'Debe devolver una cuota');
    assert.strictEqual(result.numero, 3, 'La próxima cuota debe ser la #3');
    assert.strictEqual(result.restante, 15000, 'El restante debe ser $15.000');

    // Caso 5: Totalmente pagado ($100.000 o más) -> Debe retornar null (ya no hay próxima cuota pendiente)
    result = finance.obtenerProximaCuota(montoTotal, cuotas, frecuencia, fechaInicio, 100000);
    assert.strictEqual(result, null, 'Un préstamo totalmente pagado no tiene próxima cuota');

    console.log('✅ Todas las pruebas de finance.obtenerProximaCuota pasaron correctamente.');
}

// Ejecutar pruebas
try {
    testObtenerProximaCuota();
} catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
}
