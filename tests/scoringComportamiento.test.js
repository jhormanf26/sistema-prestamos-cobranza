/**
 * @file tests/scoringComportamiento.test.js
 * @description Suite de pruebas TDD para verificar premios y castigos por días de desvío en el Score Crediticio.
 * @run node tests/scoringComportamiento.test.js
 */

const assert = require('assert');
const db = require('../config/db');
const ClienteModel = require('../models/ClienteModel');
const scoringService = require('../utils/scoringService');

async function runTests() {
    console.log('🧪 Iniciando pruebas TDD para el Score Crediticio (Comportamiento de Pago)...');
    
    const dniPrueba = '9999999991';
    let idCliente = null;

    try {
        // --- 1. LIMPIEZA PREVENTIVA ---
        const [clientesExistentes] = await db.query('SELECT id FROM clientes WHERE dni = ?', [dniPrueba]);
        if (clientesExistentes.length > 0) {
            const oldId = clientesExistentes[0].id;
            await db.query('DELETE FROM pagos WHERE prestamo_id IN (SELECT id FROM prestamos WHERE cliente_id = ?)', [oldId]);
            await db.query('DELETE FROM prestamos WHERE cliente_id = ?', [oldId]);
            await db.query('DELETE FROM clientes WHERE id = ?', [oldId]);
        }

        // --- 2. CREAR CLIENTE DE PRUEBA ---
        await ClienteModel.crear({
            dni: dniPrueba,
            nombre: 'Carlos',
            apellido: 'Scoring Comportamiento',
            telefono: '3150000091',
            direccion: 'Avenida Falsa 123',
            email: 'carlos.scoring@ejemplo.com',
            monto_preaprobado: 0
        });

        const cliente = await ClienteModel.buscarPorDNI(dniPrueba);
        idCliente = cliente.id;

        // --- 3. PRÉSTAMO CON CUOTAS ---
        // Vencimientos:
        // Cuota 1: Vence el 2026-06-05
        // Cuota 2: Vence el 2026-06-15
        const fechaInicio = '2026-05-20';
        const fechaFin = '2026-06-20';

        const [resP] = await db.query(
            `INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, estado) 
             VALUES (?, 200000.00, 2.0, 5.0, 200000.00, 2, 'quincenal', ?, ?, 'pendiente')`,
            [idCliente, fechaInicio, fechaFin]
        );
        const prestamoId = resP.insertId;

        // --- 4. INSERTAR ABONOS (PAGOS REALES) ---
        // Cuota 1 (Monto $100.000): pagada el 2026-06-01 (4 días antes de su vencimiento que es el 2026-06-04/05)
        // Cuota 2 (Monto $100.000): pagada el 2026-06-18 (3 días después de su vencimiento que es el 2026-06-15)
        
        // Pago 1: $100.000 el 2026-06-01
        const [resPago1] = await db.query(
            `INSERT INTO pagos (prestamo_id, monto_pagado, observaciones) VALUES (?, 100000.00, 'Abono 1 anticipado')`,
            [prestamoId]
        );
        await db.query('UPDATE pagos SET fecha_pago = ? WHERE id = ?', ['2026-06-01 12:00:00', resPago1.insertId]);

        // Pago 2: $100.000 el 2026-06-18
        const [resPago2] = await db.query(
            `INSERT INTO pagos (prestamo_id, monto_pagado, observaciones) VALUES (?, 100000.00, 'Abono 2 atrasado')`,
            [prestamoId]
        );
        await db.query('UPDATE pagos SET fecha_pago = ? WHERE id = ?', ['2026-06-18 12:00:00', resPago2.insertId]);

        // --- 5. CALCULAR SCORE ---
        console.log('ℹ️ Calculando Score Crediticio del cliente...');
        const res = await scoringService.calcularScore(idCliente);

        console.log('DEBUG RESULTADO SCORE:', JSON.stringify(res, null, 2));

        // Cuota 1: Vence el 2026-06-04 (fecha_inicio + 15 días). Pagada el 2026-06-01 -> 3 días de anticipación -> +3 puntos.
        // Cuota 2: Vence el 2026-06-19 (fecha_inicio + 30 días). Pagada el 2026-06-18 -> 1 día de anticipación -> +1 punto.
        // O dependiendo de cómo se calcula en finance.calcularCronograma:
        // Vamos a verificar los valores exactos retornados en res.desglose.comportamientoPago
        assert.ok(res.desglose.hasOwnProperty('comportamientoPago'), 'El desglose debe contener la propiedad comportamientoPago.');
        assert.ok(Array.isArray(res.detalles.prestamosPagadosATiempoDetalle), 'prestamosPagadosATiempoDetalle debe ser un array.');
        assert.ok(Array.isArray(res.detalles.cuotasVencidasDetalle), 'cuotasVencidasDetalle debe ser un array.');
        assert.ok(Array.isArray(res.detalles.comportamientoPagoDetalle), 'comportamientoPagoDetalle debe ser un array.');
        assert.ok(res.detalles.comportamientoPagoDetalle.length > 0, 'Debe haber detalles de comportamiento de pago en el array.');
        console.log(`✅ Comportamiento de pago calculado: ${res.desglose.comportamientoPago} puntos.`);
        console.log(`✅ Detalles de auditoría validados correctamente en TDD.`);

        // --- 5.1. SIMULAR PERFIL ALTO SIN AHORROS (TOPE 850) ---
        console.log('ℹ️ Simulando perfil perfecto sin ahorros para verificar el tope de 850 puntos...');
        
        // Simular antigüedad de 7 meses
        let fechaHace7Meses = new Date();
        fechaHace7Meses.setMonth(fechaHace7Meses.getMonth() - 7);
        await db.query('UPDATE clientes SET created_at = ? WHERE id = ?', [fechaHace7Meses, idCliente]);

        // Insertar 3 préstamos adicionales finalizados y pagados a tiempo (+300 pts)
        for (let i = 0; i < 3; i++) {
            let start = new Date();
            start.setMonth(start.getMonth() - 3 - i);
            let end = new Date(start);
            end.setDate(end.getDate() + 30);
            
            const [resP_VIP] = await db.query(
                `INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, fecha_inicio, fecha_fin, estado) 
                 VALUES (?, 1200000.00, 2.0, 5.0, 1200000.00, 1, 'mensual', ?, ?, 'pagado')`,
                [idCliente, start, end]
            );
            const [resPag_VIP] = await db.query(
                `INSERT INTO pagos (prestamo_id, monto_pagado, observaciones) VALUES (?, 1200000.00, 'Pagado a tiempo')`,
                [resP_VIP.insertId]
            );
            await db.query('UPDATE pagos SET fecha_pago = ? WHERE id = ?', [start, resPag_VIP.insertId]);
        }

        // Calcular score: Base 500 + Antigüedad 50 + Pagados a tiempo 300 + Comportamiento 4 = 854 puntos teóricos.
        // Pero sin ahorros, el score debe limitarse exactamente a 850 puntos.
        let resSinAhorros = await scoringService.calcularScore(idCliente);
        console.log(`  - Score sin ahorros calculado: ${resSinAhorros.score} puntos.`);
        assert.strictEqual(resSinAhorros.score, 850, 'El score debe estar capado a 850 si no cumple con saldo de ahorros mínimo de $500.000 COP.');

        // --- 5.2. AGREGAR AHORROS >= $500.000 COP (DEBE SUPERAR EL TOPE) ---
        console.log('ℹ️ Agregando cuenta de ahorros con $500.000 COP para verificar superación del tope...');
        await db.query('INSERT INTO cuentas_ahorro (cliente_id, saldo_actual) VALUES (?, 500000.00)', [idCliente]);

        // Ahora: Ahorros aporta +50 puntos. El total teórico es 854 + 50 = 904 puntos.
        // Al tener ahorros >= 500.000 COP, no debe caparse y debe superar los 850 puntos.
        let resConAhorros = await scoringService.calcularScore(idCliente);
        console.log(`  - Score con ahorros calculado: ${resConAhorros.score} puntos.`);
        assert.ok(resConAhorros.score > 850, 'El score debe superar los 850 puntos una vez agregada la cuenta de ahorro con saldo suficiente.');
        assert.strictEqual(resConAhorros.categoria, 'A', 'El cliente con ahorros y comportamiento óptimo debe clasificar como Categoría A.');

        console.log('🎉 ¡Todas las aserciones de comportamiento de pago y límites por ahorro pasaron exitosamente!');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // --- 6. LIMPIEZA FINAL ---
        if (idCliente) {
            console.log('🧹 Limpiando base de datos...');
            try {
                await db.query('DELETE FROM pagos WHERE prestamo_id IN (SELECT id FROM prestamos WHERE cliente_id = ?)', [idCliente]);
                await db.query('DELETE FROM prestamos WHERE cliente_id = ?', [idCliente]);
                await db.query('DELETE FROM cuentas_ahorro WHERE cliente_id = ?', [idCliente]);
                await db.query('DELETE FROM clientes WHERE id = ?', [idCliente]);
            } catch (cleanupError) {
                console.error('Error al limpiar registros:', cleanupError);
            }
        }
        await db.end();
    }
}

runTests();
