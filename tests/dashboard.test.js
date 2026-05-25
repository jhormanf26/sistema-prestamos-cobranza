/**
 * @file tests/dashboard.test.js
 * @description Suite de pruebas de integración TDD para validar que la métrica "Monto en Riesgo" descuente correctamente los abonos realizados por los clientes.
 */

const assert = require('assert');
const DashboardModel = require('../models/DashboardModel');
const db = require('../config/db');

/**
 * Ejecuta las pruebas de integración del dashboard.
 * @async
 * @function runTests
 * @returns {Promise<void>}
 */
async function runTests() {
    console.log('🧪 Iniciando pruebas de integración TDD para DashboardModel...');
    
    let clienteId = null;
    let prestamoId = null;
    let pagoId = null;

    try {
        // 0. Limpieza preventiva de pruebas anteriores fallidas
        console.log('ℹ️ Realizando limpieza preventiva de datos de prueba...');
        await db.query("DELETE FROM clientes WHERE DNI = '99999991'");

        // 1. Crear un cliente temporal para la prueba
        console.log('ℹ️ Creando cliente temporal...');
        const [resCliente] = await db.query(`
            INSERT INTO clientes (dni, nombre, apellido, telefono, direccion, email)
            VALUES ('99999991', 'Test', 'Dashboard', '3000000000', 'Calle Test', 'test.dash@correo.com')
        `);
        clienteId = resCliente.insertId;

        // 2. Crear un préstamo temporal en mora (vencido)
        // Se define una fecha de inicio pasada ('2026-01-01') y 1 cuota de 50.000 para forzar la mora.
        console.log('ℹ️ Creando préstamo temporal vencido...');
        const [resPrestamo] = await db.query(`
            INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, estado, fecha_inicio, fecha_fin)
            VALUES (?, 40000.00, 25.00, 0.00, 50000.00, 1, 'Mensual', 'pendiente', '2026-01-01', '2026-02-01')
        `, [clienteId]);
        prestamoId = resPrestamo.insertId;

        // 3. Consultar totales iniciales del dashboard
        console.log('🔍 Consultando estado inicial de Monto en Riesgo...');
        const totalesIniciales = await DashboardModel.obtenerTotales();
        const riesgoInicial = parseFloat(totalesIniciales.montoEnRiesgo);
        console.log(`✅ Monto en riesgo inicial: ${riesgoInicial}`);

        // 4. Registrar un abono (pago parcial) de 20.000
        console.log('ℹ️ Registrando abono de 20.000 en el préstamo vencido...');
        const [resPago] = await db.query(`
            INSERT INTO pagos (prestamo_id, monto_pagado, observaciones)
            VALUES (?, 20000.00, 'Abono de prueba TDD')
        `, [prestamoId]);
        pagoId = resPago.insertId;

        // 5. Consultar totales finales del dashboard
        console.log('🔍 Consultando estado final de Monto en Riesgo...');
        const totalesFinales = await DashboardModel.obtenerTotales();
        const riesgoFinal = parseFloat(totalesFinales.montoEnRiesgo);
        console.log(`✅ Monto en riesgo final: ${riesgoFinal}`);

        // 6. Verificar que la diferencia sea exactamente 20.000
        const diferencia = riesgoInicial - riesgoFinal;
        console.log(`📊 Diferencia calculada: ${diferencia} (Esperado: 20000)`);
        
        assert.strictEqual(diferencia, 20000.00, 'El monto en riesgo debería reducirse exactamente en el valor del abono registrado (20.000).');
        console.log('✅ Aserción exitosa: El abono se descontó correctamente del monto en riesgo.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas:', error);
        process.exit(1);
    } finally {
        // 7. Limpiar la base de datos eliminando los registros temporales en orden inverso de claves foráneas
        console.log('ℹ️ Iniciando limpieza de registros temporales...');
        
        if (pagoId) {
            await db.query('DELETE FROM pagos WHERE id = ?', [pagoId]);
            console.log('🗑️ Abono de prueba eliminado.');
        }
        if (prestamoId) {
            await db.query('DELETE FROM prestamos WHERE id = ?', [prestamoId]);
            console.log('🗑️ Préstamo de prueba eliminado.');
        }
        if (clienteId) {
            await db.query('DELETE FROM clientes WHERE id = ?', [clienteId]);
            console.log('🗑️ Cliente de prueba eliminado.');
        }

        // Cerrar la conexión a la base de datos de manera limpia
        await db.end();
        console.log('🏁 Pruebas de dashboard finalizadas.');
    }
}

// Ejecutar
runTests();
