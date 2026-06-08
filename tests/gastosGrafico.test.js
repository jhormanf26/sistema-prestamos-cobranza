/**
 * @file tests/gastosGrafico.test.js
 * @description Caso de prueba TDD de integración para validar el método obtenerTodosFiltrados del GastoModel.
 */

const assert = require('assert');
const GastoModel = require('../models/GastoModel');
const db = require('../config/db');

async function runTests() {
    console.log('🧪 Iniciando pruebas TDD para el gráfico de Gastos Operativos (obtenerTodosFiltrados)...');
    const insertados = [];

    try {
        // 1. Insertar gastos de prueba
        const gasto1 = {
            descripcion: 'Prueba Grafico Luz Oficina',
            monto: 75000.00,
            categoria: 'Servicios',
            registrado_por: 'Tester Graficos',
            observacion: 'Prueba TDD Grafico 1',
            fecha_gasto: '2026-06-01'
        };

        const gasto2 = {
            descripcion: 'Prueba Grafico Gasolina Camioneta',
            monto: 120000.00,
            categoria: 'Carro',
            registrado_por: 'Tester Graficos',
            observacion: 'Prueba TDD Grafico 2',
            fecha_gasto: '2026-06-02'
        };

        console.log('ℹ️ Insertando gastos de prueba...');
        const res1 = await GastoModel.crear(gasto1);
        insertados.push(res1.insertId);
        
        const res2 = await GastoModel.crear(gasto2);
        insertados.push(res2.insertId);

        console.log(`✅ Gastos de prueba insertados con IDs: ${insertados.join(', ')}`);

        // 2. Probar obtenerTodosFiltrados sin filtro
        console.log('ℹ️ Validando obtenerTodosFiltrados sin parámetros (debe incluir ambos)...');
        const todos = await GastoModel.obtenerTodosFiltrados('');
        assert.ok(todos.length >= 2, 'Debe haber al menos 2 gastos registrados en total.');
        
        const encontrado1 = todos.find(g => g.id === insertados[0]);
        const encontrado2 = todos.find(g => g.id === insertados[1]);
        assert.ok(encontrado1, 'Debería encontrarse el gasto 1 en la lista completa.');
        assert.ok(encontrado2, 'Debería encontrarse el gasto 2 en la lista completa.');

        // 3. Probar obtenerTodosFiltrados con filtro por descripción
        console.log('ℹ️ Validando obtenerTodosFiltrados con filtro "Luz Oficina" (debe traer solo el gasto 1)...');
        const filtradoLuz = await GastoModel.obtenerTodosFiltrados('Luz Oficina');
        const tieneLuz = filtradoLuz.every(g => g.descripcion.includes('Luz Oficina') || g.categoria.includes('Luz Oficina'));
        assert.ok(tieneLuz, 'Todos los gastos retornados deben cumplir con el criterio de búsqueda.');
        
        const contieneG1 = filtradoLuz.some(g => g.id === insertados[0]);
        const contieneG2 = filtradoLuz.some(g => g.id === insertados[1]);
        assert.ok(contieneG1, 'El gasto 1 debería estar en los resultados de "Luz Oficina".');
        assert.ok(!contieneG2, 'El gasto 2 NO debería estar en los resultados de "Luz Oficina".');

        // 4. Probar obtenerTodosFiltrados con filtro por categoría
        console.log('ℹ️ Validando obtenerTodosFiltrados con filtro "Carro" (debe traer el gasto 2)...');
        const filtradoCarro = await GastoModel.obtenerTodosFiltrados('Carro');
        const contieneG1Carro = filtradoCarro.some(g => g.id === insertados[0]);
        const contieneG2Carro = filtradoCarro.some(g => g.id === insertados[1]);
        assert.ok(!contieneG1Carro, 'El gasto 1 (Servicios) NO debería estar en los resultados de "Carro".');
        assert.ok(contieneG2Carro, 'El gasto 2 (Carro) debería estar en los resultados de "Carro".');

        console.log('🎉 ¡Todas las aserciones pasaron exitosamente!');

    } catch (error) {
        console.error('❌ Error en las pruebas TDD:', error);
        process.exit(1);
    } finally {
        // Limpieza de datos de prueba
        if (insertados.length > 0) {
            console.log('ℹ️ Limpiando la base de datos...');
            for (const id of insertados) {
                try {
                    await GastoModel.eliminar(id);
                } catch (e) {
                    console.error(`Error al eliminar gasto id ${id}:`, e);
                }
            }
            console.log('✅ Base de datos limpia.');
        }
        await db.end();
        console.log('🏁 Pruebas TDD finalizadas.');
    }
}

runTests();
