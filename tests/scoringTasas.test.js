/**
 * @file tests/scoringTasas.test.js
 * @description Suite de pruebas TDD para la función `obtenerTasaPorScore` del servicio de scoring.
 *              Verifica que cada rango de score retorne la tasa mensual y de mora correctas.
 * @run node tests/scoringTasas.test.js
 */

const scoringService = require('../utils/scoringService');

/** Contador de resultados */
let passed = 0;
let failed = 0;

/**
 * Ejecuta una aserción simple de igualdad.
 * @param {string} descripcion - Descripción del caso de prueba.
 * @param {*} valorObtenido - Valor resultado de la función.
 * @param {*} valorEsperado - Valor esperado para la comparación.
 */
function assert(descripcion, valorObtenido, valorEsperado) {
    if (valorObtenido === valorEsperado) {
        console.log(`  ✅ PASS: ${descripcion}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${descripcion}`);
        console.error(`     Esperado: ${valorEsperado} | Obtenido: ${valorObtenido}`);
        failed++;
    }
}

/**
 * Define un grupo de pruebas relacionadas.
 * @param {string} nombre - Nombre del bloque de prueba.
 * @param {Function} fn - Función que contiene las aserciones.
 */
function describe(nombre, fn) {
    console.log(`\n📋 ${nombre}`);
    fn();
}

// ─── Casos de prueba ──────────────────────────────────────────────────────────

describe('Categoría A — Score Excelente (900-1000)', () => {
    const r = scoringService.obtenerTasaPorScore(950);
    assert('Score 950 → categoría A',       r.categoria,   'A');
    assert('Score 950 → tasa 1.5% mensual', r.tasaMensual, 1.5);
    assert('Score 950 → mora 2.5%',         r.tasaMora,    2.5);

    const rLimite = scoringService.obtenerTasaPorScore(900);
    assert('Score 900 (límite) → categoría A',       rLimite.categoria,   'A');
    assert('Score 900 (límite) → tasa 1.5% mensual', rLimite.tasaMensual, 1.5);

    const rPerfecto = scoringService.obtenerTasaPorScore(1000);
    assert('Score 1000 (máximo) → categoría A', rPerfecto.categoria, 'A');
});

describe('Categoría B — Score Bueno (700-899)', () => {
    const r = scoringService.obtenerTasaPorScore(750);
    assert('Score 750 → categoría B',       r.categoria,   'B');
    assert('Score 750 → tasa 2.0% mensual', r.tasaMensual, 2.0);
    assert('Score 750 → mora 3.0%',         r.tasaMora,    3.0);

    const rLimite = scoringService.obtenerTasaPorScore(700);
    assert('Score 700 (límite) → categoría B', rLimite.categoria, 'B');

    const rTecho = scoringService.obtenerTasaPorScore(899);
    assert('Score 899 (techo B) → categoría B', rTecho.categoria, 'B');
});

describe('Categoría C — Score Regular (500-699)', () => {
    const r = scoringService.obtenerTasaPorScore(550);
    assert('Score 550 → categoría C',       r.categoria,   'C');
    assert('Score 550 → tasa 2.5% mensual', r.tasaMensual, 2.5);
    assert('Score 550 → mora 3.5%',         r.tasaMora,    3.5);

    const rLimite = scoringService.obtenerTasaPorScore(500);
    assert('Score 500 (límite) → categoría C', rLimite.categoria, 'C');
});

describe('Categoría D — Score Malo (300-499)', () => {
    const r = scoringService.obtenerTasaPorScore(350);
    assert('Score 350 → categoría D',       r.categoria,   'D');
    assert('Score 350 → tasa 3.0% mensual', r.tasaMensual, 3.0);
    assert('Score 350 → mora 4.0%',         r.tasaMora,    4.0);

    const rLimite = scoringService.obtenerTasaPorScore(300);
    assert('Score 300 (límite) → categoría D', rLimite.categoria, 'D');
});

describe('Categoría E — Score Crítico (0-299)', () => {
    const r = scoringService.obtenerTasaPorScore(100);
    assert('Score 100 → categoría E',       r.categoria,   'E');
    assert('Score 100 → tasa 3.5% mensual', r.tasaMensual, 3.5);
    assert('Score 100 → mora 4.5%',         r.tasaMora,    4.5);

    const rCero = scoringService.obtenerTasaPorScore(0);
    assert('Score 0 (mínimo) → categoría E', rCero.categoria, 'E');

    const rLimite = scoringService.obtenerTasaPorScore(299);
    assert('Score 299 (techo E) → categoría E', rLimite.categoria, 'E');
});

describe('Regla transversal: mora = interés + 1%', () => {
    [0, 100, 300, 350, 500, 550, 700, 750, 900, 950, 1000].forEach(s => {
        const r = scoringService.obtenerTasaPorScore(s);
        assert(
            `Score ${s}: mora (${r.tasaMora}%) = interés (${r.tasaMensual}%) + 1%`,
            r.tasaMora,
            parseFloat((r.tasaMensual + 1).toFixed(2))
        );
    });
});


// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`📊 Resultados: ${passed} pasaron ✅ | ${failed} fallaron ❌`);
if (failed === 0) {
    console.log('🎉 ¡Todos los casos de prueba pasaron correctamente!');
    process.exit(0);
} else {
    console.error('💥 Algunos casos de prueba fallaron. Revisa los errores arriba.');
    process.exit(1);
}
