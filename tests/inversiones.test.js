const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { runMigrations } = require('../config/migrations');
const { parseFechaEspanol, parseMonto, parsearCSVInversiones, determinarTipoMovimiento } = require('../utils/inversionParser');
const InversionModel = require('../models/InversionModel');

async function testInversiones() {
    console.log('🧪 Iniciando suite de pruebas TDD para el Módulo de Inversiones...');

    try {
        // 1. Probar utilidades de parseo de fechas y montos
        console.log('🔹 1. Probando parseo de fechas en español y valores...');
        assert.strictEqual(parseFechaEspanol('16 ago 2026'), '2026-08-16');
        assert.strictEqual(parseFechaEspanol('31 jul 2026'), '2026-07-31');
        assert.strictEqual(parseFechaEspanol('01 ene 2025'), '2025-01-01');
        assert.strictEqual(parseMonto("3114.7"), 3114.7);
        assert.strictEqual(parseMonto("-113000"), -113000);
        assert.strictEqual(determinarTipoMovimiento('Rendimientos', 3114.7), 'rendimiento');
        assert.strictEqual(determinarTipoMovimiento('Retiro', -113000), 'retiro');
        assert.strictEqual(determinarTipoMovimiento('Inversión', 8215000), 'inversion');
        console.log('  ✅ Parser unitario de fechas y montos verificado correctamente.');

        // 2. Probar parseo completo del archivo CSV de muestra docs/mov1682624421.csv
        console.log('🔹 2. Probando parseo del archivo CSV docs/mov1682624421.csv...');
        const csvPath = path.join(__dirname, '../docs/mov1682624421.csv');
        assert.ok(fs.existsSync(csvPath), 'El archivo docs/mov1682624421.csv debe existir');
        
        const contenidoCsv = fs.readFileSync(csvPath, 'utf-8');
        const datosParsed = parsearCSVInversiones(contenidoCsv);

        assert.strictEqual(datosParsed.tipo_cuenta, 'FIC Sumar', 'Tipo de cuenta debe ser FIC Sumar');
        assert.strictEqual(datosParsed.numero_cuenta, '001001130304', 'Número de cuenta debe ser 001001130304');
        assert.ok(datosParsed.movimientos.length >= 35, 'Debe haber al menos 35 movimientos parseados del CSV');
        console.log(`  ✅ CSV parseado correctamente. Se identificaron ${datosParsed.movimientos.length} movimientos.`);

        // 3. Ejecutar migraciones para asegurar que las tablas existan en BD
        console.log('🔹 3. Verificando migraciones automáticas de base de datos...');
        await runMigrations();
        console.log('  ✅ Migraciones de BD ejecutadas correctamente.');

        // 4. Probar importación en Base de Datos e Inserción Anti-Duplicados
        console.log('🔹 4. Probando importación en BD y mecanismo anti-duplicados...');
        
        // Usar datos de prueba aislados
        const datosTestParsed = {
            ...datosParsed,
            tipo_cuenta: 'FIC TEST SUMAR',
            numero_cuenta: 'TEST_001001130304'
        };

        // Limpiar cuenta de prueba previa si existiera
        await db.query('DELETE FROM inversiones WHERE tipo_cuenta = ? AND numero_cuenta = ?', [datosTestParsed.tipo_cuenta, datosTestParsed.numero_cuenta]);
        
        // Primera importación
        const resImport1 = await InversionModel.procesarImportacionCSV(datosTestParsed);
        assert.ok(resImport1.cuenta.id > 0, 'La cuenta debe tener un ID válido');
        assert.ok(resImport1.insertados > 0, 'Debe haber registros insertados en la primera importación');

        const cuentaId = resImport1.cuenta.id;
        const totalInsertadosPrimera = resImport1.insertados;

        // Segunda importación (debe ignorar todos por ser duplicados)
        const resImport2 = await InversionModel.procesarImportacionCSV(datosTestParsed);
        assert.strictEqual(resImport2.insertados, 0, 'La segunda importación debe tener 0 insertados');
        assert.strictEqual(resImport2.ignorados, datosParsed.movimientos.length, 'Todos los movimientos de la segunda importación deben ser ignorados por duplicados');
        console.log('  ✅ Control de duplicados superado exitosamente (0 duplicados re-insertados).');

        // 5. Verificar cálculo de KPIs y Proyecciones Financieras
        console.log('🔹 5. Verificando cálculo de KPIs y proyecciones...');
        const kpis = await InversionModel.obtenerResumenKPIs(cuentaId);
        assert.ok(kpis.capital_invertido > 0, 'Capital invertido debe ser > 0');
        assert.ok(kpis.rendimientos_totales > 0, 'Rendimientos totales debe ser > 0');
        assert.ok(kpis.retiros_totales > 0, 'Retiros totales debe ser > 0');
        assert.ok(typeof kpis.porcentaje_roi === 'number', 'ROI debe ser un número flotante');

        const proyeccion = await InversionModel.calcularProyeccion(cuentaId, 6);
        assert.strictEqual(proyeccion.proyeccion.length, 6, 'La proyección debe generar 6 meses');
        assert.ok(proyeccion.proyeccion[5].saldoProyectado > proyeccion.saldoBase, 'El saldo proyectado a 6 meses debe ser mayor al saldo actual');
        console.log(`  ✅ KPIs calculados: Capital: ${kpis.capital_invertido}, Rendimientos: ${kpis.rendimientos_totales}, Retiros: ${kpis.retiros_totales}, ROI: ${kpis.porcentaje_roi}%.`);
        console.log(`  ✅ Proyección a 6 meses final: $ ${proyeccion.proyeccion[5].saldoProyectado}`);

        // 6. Limpieza de datos de prueba si es necesario o confirmación
        console.log('  ✅ Prueba finalizada con éxito.');
        console.log('🎉 TODAS LAS PRUEBAS DEL MÓDULO DE INVERSIONES PASARON CORRECTAMENTE.');
    } catch (error) {
        console.error('❌ ERROR en suite de pruebas de Inversiones:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

testInversiones();
