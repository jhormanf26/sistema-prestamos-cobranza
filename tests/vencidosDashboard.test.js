/**
 * @file tests/vencidosDashboard.test.js
 * @description Caso de prueba TDD para validar que obtenerProximosVencimientos incluya préstamos con cuotas vencidas y no pagadas.
 */

const assert = require('assert');
const DashboardModel = require('../models/DashboardModel');
const db = require('../config/db');

async function runTests() {
    console.log('🧪 Iniciando prueba TDD para ' + 'obtenerProximosVencimientos...');
    
    let clienteId = null;
    let prestamoId = null;

    try {
        // Limpieza preventiva ordenada
        console.log('ℹ️ Realizando limpieza preventiva...');
        const [oldClients] = await db.query("SELECT id FROM clientes WHERE DNI = '99999992'");
        if (oldClients.length > 0) {
            const oldClientId = oldClients[0].id;
            await db.query("DELETE FROM pagos WHERE prestamo_id IN (SELECT id FROM prestamos WHERE cliente_id = ?)", [oldClientId]);
            await db.query("DELETE FROM prestamos WHERE cliente_id = ?", [oldClientId]);
            await db.query("DELETE FROM clientes WHERE id = ?", [oldClientId]);
        }

        // 1. Crear un cliente temporal
        const [resCliente] = await db.query(`
            INSERT INTO clientes (dni, nombre, apellido, telefono, direccion, email)
            VALUES ('99999992', 'Test Vencido', 'Dashboard', '3000000000', 'Calle Test 2', 'test.vencido@correo.com')
        `);
        clienteId = resCliente.insertId;

        // 2. Crear un préstamo con cuota vencida en el pasado (fecha_inicio = 2 meses atrás, 1 cuota mensual)
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 2);
        const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

        const fechaFin = new Date();
        fechaFin.setMonth(fechaFin.getMonth() - 1);
        const fechaFinStr = fechaFin.toISOString().split('T')[0];

        console.log(`ℹ️ Creando préstamo vencido con fecha de inicio: ${fechaInicioStr}`);
        const [resPrestamo] = await db.query(`
            INSERT INTO prestamos (cliente_id, monto_prestado, tasa_interes, tasa_mora, monto_total, cuotas, frecuencia, estado, fecha_inicio, fecha_fin)
            VALUES (?, 100000.00, 2.0, 1.0, 120000.00, 1, 'Mensual', 'vencido', ?, ?)
        `, [clienteId, fechaInicioStr, fechaFinStr]);
        prestamoId = resPrestamo.insertId;

        // 3. Ejecutar obtenerProximosVencimientos
        const vencimientos = await DashboardModel.obtenerProximosVencimientos(30);
        console.log(`🔍 Se obtuvieron ${vencimientos.length} vencimientos.`);

        // 4. Validar que el préstamo creado esté incluido
        const encontrado = vencimientos.find(v => v.id === prestamoId);
        
        assert.ok(encontrado, 'El préstamo vencido debería estar incluido en la lista de vencimientos.');
        console.log('✅ Aserción exitosa: El préstamo vencido fue incluido correctamente.');

    } catch (error) {
        console.error('❌ Error durante la prueba TDD:', error);
        process.exit(1);
    } finally {
        // Limpieza de datos
        if (prestamoId) {
            await db.query('DELETE FROM pagos WHERE prestamo_id = ?', [prestamoId]);
            await db.query('DELETE FROM prestamos WHERE id = ?', [prestamoId]);
        }
        if (clienteId) {
            await db.query('DELETE FROM clientes WHERE id = ?', [clienteId]);
        }
        await db.end();
        console.log('🏁 Pruebas finalizadas.');
    }
}

runTests();
