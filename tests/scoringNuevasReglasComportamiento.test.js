/**
 * @file tests/scoringNuevasReglasComportamiento.test.js
 * @description Prueba TDD para verificar las nuevas reglas de scoring para comportamiento de pago:
 *              - Los días de mora restan 2 puntos por día (antes 1).
 *              - Los días de anticipación suman 1 punto por día (máx 10 por cuota/plazo).
 * @run node tests/scoringNuevasReglasComportamiento.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const scoringService = require('../utils/scoringService');

async function testNuevasReglasComportamiento() {
    console.log('🧪 Iniciando prueba TDD para validar nuevas reglas de scoring en comportamiento de pago...');
    
    const dniPrueba = '999123456';
    
    try {
        // Limpiar registros previos si existen
        await db.query('DELETE FROM pagos WHERE prestamo_id IN (SELECT id FROM prestamos WHERE cliente_id IN (SELECT id FROM clientes WHERE dni = ?))', [dniPrueba]);
        await db.query('DELETE FROM prestamos WHERE cliente_id IN (SELECT id FROM clientes WHERE dni = ?)', [dniPrueba]);
        await db.query('DELETE FROM cuentas_ahorro WHERE cliente_id IN (SELECT id FROM clientes WHERE dni = ?)', [dniPrueba]);
        await db.query('DELETE FROM clientes WHERE dni = ?', [dniPrueba]);

        // Crear cliente de prueba
        const [resCliente] = await db.query(
            `INSERT INTO clientes (dni, nombre, apellido, telefono, direccion, email) 
             VALUES (?, 'Pedro', 'TDD Comportamiento', '3151112233', 'Calle TDD 123', 'pedro.tdd@ejemplo.com')`,
            [dniPrueba]
        );
        const idCliente = resCliente.insertId;

        // Crear cuenta de ahorro con saldo suficiente para evitar tope de 850
        await db.query('INSERT INTO cuentas_ahorro (cliente_id, saldo_actual) VALUES (?, 500000.00)', [idCliente]);

        // Crear préstamo de prueba con 2 cuotas quincenales
        const fechaInicio = '2026-05-01';
        const fechaFin = '2026-06-01';

        const [resP] = await db.query(
            `INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, estado) 
             VALUES (?, 200000.00, 2.0, 5.0, 200000.00, 2, 'quincenal', ?, ?, 'pendiente')`,
            [idCliente, fechaInicio, fechaFin]
        );
        const prestamoId = resP.insertId;

        // Cuota 1: Vence el 2026-05-16.
        // Cuota 2: Vence el 2026-05-31.

        // Abono 1 (Cuota 1): pagado el 2026-05-01 (15 días de anticipación).
        // Según la nueva regla, debe dar un máximo de +10 puntos (antes +15).
        const [resPago1] = await db.query(
            `INSERT INTO pagos (prestamo_id, monto_pagado, observaciones) VALUES (?, 100000.00, 'Abono 1 muy anticipado')`,
            [prestamoId]
        );
        await db.query('UPDATE pagos SET fecha_pago = ? WHERE id = ?', ['2026-05-01 12:00:00', resPago1.insertId]);

        // Abono 2 (Cuota 2): pagado el 2026-06-05 (5 días de demora).
        // Según la nueva regla, debe restar 5 * 2 = -10 puntos (antes -5).
        const [resPago2] = await db.query(
            `INSERT INTO pagos (prestamo_id, monto_pagado, observaciones) VALUES (?, 100000.00, 'Abono 2 atrasado')`,
            [prestamoId]
        );
        await db.query('UPDATE pagos SET fecha_pago = ? WHERE id = ?', ['2026-06-05 12:00:00', resPago2.insertId]);

        // Calcular Score
        const scoreInfo = await scoringService.calcularScore(idCliente);
        console.log('  - Detalles de comportamiento calculados:', JSON.stringify(scoreInfo.detalles.comportamientoPagoDetalle, null, 2));
        console.log(`  - Puntos de comportamiento en el desglose: ${scoreInfo.desglose.comportamientoPago}`);

        // Aserciones
        const detPago1 = scoreInfo.detalles.comportamientoPagoDetalle.find(d => d.numeroCuota === 1);
        const detPago2 = scoreInfo.detalles.comportamientoPagoDetalle.find(d => d.numeroCuota === 2);

        assert.ok(detPago1, 'Debe existir el detalle de la cuota 1.');
        assert.strictEqual(detPago1.puntos, 10, 'La cuota 1 pagada con 15 días de anticipación debe dar exactamente 10 puntos (máximo por cuota).');

        assert.ok(detPago2, 'Debe existir el detalle de la cuota 2.');
        assert.strictEqual(detPago2.puntos, -10, 'La cuota 2 pagada con 5 días de demora debe restar exactamente 10 puntos (-2 por día).');

        // Limpieza de datos
        await db.query('DELETE FROM pagos WHERE prestamo_id = ?', [prestamoId]);
        await db.query('DELETE FROM prestamos WHERE id = ?', [prestamoId]);
        await db.query('DELETE FROM cuentas_ahorro WHERE cliente_id = ?', [idCliente]);
        await db.query('DELETE FROM clientes WHERE id = ?', [idCliente]);

        console.log('✅ PASS: Las nuevas reglas de comportamiento de pago (tope de anticipación de 10 pts y demora de -2 pts/día) funcionan correctamente.');
        process.exit(0);

    } catch (error) {
        console.error('❌ FAIL: Error en la prueba TDD:', error);
        process.exit(1);
    }
}

testNuevasReglasComportamiento();
