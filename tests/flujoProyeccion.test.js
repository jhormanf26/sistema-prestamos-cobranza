const assert = require('assert');
const db = require('../config/db');
const FlujoCajaProyeccionModel = require('../models/FlujoCajaProyeccionModel');

/**
 * Suite de pruebas TDD para verificar el funcionamiento del modelo de Proyección de Flujo de Caja.
 */
async function ejecutarPruebasFlujoProyeccion() {
    console.log('🧪 Iniciando Suite de Pruebas TDD para Proyección de Flujo de Caja...');

    try {
        // 1. Probar saldo inicial de caja
        console.log('🔍 Probando obtención del saldo inicial de caja...');
        const saldoInicial = await FlujoCajaProyeccionModel.obtenerSaldoInicialCaja();
        assert.strictEqual(typeof saldoInicial, 'number', 'El saldo inicial de caja debe ser un número.');
        console.log(`✅ Saldo inicial actual de caja: ${saldoInicial}`);

        // 2. Probar promedio de gastos diarios
        console.log('🔍 Probando obtención del promedio de gastos diarios (debe ser 0)...');
        const promedioGastos = await FlujoCajaProyeccionModel.obtenerPromedioGastosDiarios();
        assert.strictEqual(promedioGastos, 0, 'El promedio de gastos diarios para proyección debe ser exactamente 0.');
        console.log(`✅ Promedio de gastos diarios es 0.`);

        // 3. Probar el listado de préstamos activos con pagos
        console.log('🔍 Probando obtención de préstamos activos pendientes...');
        const prestamos = await FlujoCajaProyeccionModel.obtenerPrestamosActivosConPagos();
        assert.ok(Array.isArray(prestamos), 'Debe retornar una lista (array).');
        console.log(`✅ Cantidad de préstamos pendientes encontrados: ${prestamos.length}`);

        // 4. Probar el cálculo completo de la proyección para 15 días
        console.log('📊 Probando cálculo de proyección para 15 días...');
        const rango15 = 15;
        const proy15 = await FlujoCajaProyeccionModel.calcularProyeccion(rango15);

        assert.ok(proy15, 'La proyección debe retornar un objeto con resultados.');
        assert.strictEqual(typeof proy15.saldoInicial, 'number', 'El saldo inicial en la proyección debe ser un número.');
        assert.strictEqual(typeof proy15.saldoFinalProyectado, 'number', 'El saldo final en la proyección debe ser un número.');
        assert.strictEqual(proy15.gastoDiarioEstimado, 0, 'El gasto diario estimado en la proyección debe ser 0.');
        assert.strictEqual(proy15.totalEgresosProyectados, 0, 'El total de egresos proyectados en la proyección debe ser 0.');
        assert.ok(Array.isArray(proy15.serie), 'La serie de tiempo debe ser un array.');
        assert.strictEqual(proy15.serie.length, rango15 + 1, `La serie de tiempo debe tener exactamente ${rango15 + 1} elementos (del día 0 al 15).`);

        // Validar que en toda la serie de tiempo los egresos sean 0
        proy15.serie.forEach((item, idx) => {
            assert.strictEqual(item.egresos, 0, `El egreso proyectado para el día ${idx} debe ser 0.`);
            assert.strictEqual(item.saldoNeto, item.ingresos, `El saldo neto para el día ${idx} debe ser igual a los ingresos.`);
        });

        // Validar el primer día (Hoy)
        const primerDia = proy15.serie[0];
        assert.strictEqual(primerDia.saldoProyectado, proy15.saldoInicial, 'El saldo del día hoy debe ser igual al saldo inicial.');

        // 5. Probar el cálculo completo de la proyección para 30 días
        console.log('📊 Probando cálculo de proyección para 30 días...');
        const rango30 = 30;
        const proy30 = await FlujoCajaProyeccionModel.calcularProyeccion(rango30);
        assert.strictEqual(proy30.serie.length, rango30 + 1, `La serie de tiempo de 30 días debe tener exactamente ${rango30 + 1} elementos.`);

        // 6. Probar el cálculo completo de la proyección para 45 días
        console.log('📊 Probando cálculo de proyección para 45 días...');
        const rango45 = 45;
        const proy45 = await FlujoCajaProyeccionModel.calcularProyeccion(rango45);
        assert.strictEqual(proy45.serie.length, rango45 + 1, `La serie de tiempo de 45 días debe tener exactamente ${rango45 + 1} elementos.`);

        console.log('✅ Pruebas TDD de Proyección de Flujo de Caja COMPLETADAS CON ÉXITO.');

    } catch (error) {
        console.error('❌ Error durante la ejecución de las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // Cerrar la conexión a la base de datos de manera limpia
        db.end();
    }
}

ejecutarPruebasFlujoProyeccion();
