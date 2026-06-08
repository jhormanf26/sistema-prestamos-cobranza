/**
 * @file tests/auditoriaPuntosNeto.test.js
 * @description Test TDD para validar que el resumen de auditoría de comportamiento de pago
 *              muestra tres campos: Puntos a Favor, Puntos en Contra y el Neto (resta entre ambos).
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../views/clientes/perfil.ejs');
const content = fs.readFileSync(filePath, 'utf8');

let passed = 0;
let failed = 0;

/**
 * Evalúa una condición de prueba e imprime el resultado.
 * @param {string} nombre - Nombre descriptivo del test.
 * @param {boolean} condicion - Resultado de la evaluación.
 */
function test(nombre, condicion) {
    if (condicion) {
        console.log(`  ✅ PASS: ${nombre}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${nombre}`);
        failed++;
    }
}

console.log('\n🧪 Ejecutando Tests: Neto de Puntos en Auditoría de Comportamiento de Pago\n');

// ── Test 1: Existe el campo "Puntos a Favor" ──────────────────────────────
test('El campo "Puntos a Favor" está presente', content.includes('Puntos a Favor'));

// ── Test 2: Existe el campo "Puntos en Contra" ───────────────────────────
test('El campo "Puntos en Contra" está presente', content.includes('Puntos en Contra'));

// ── Test 3: Existe el campo "Resultado Neto" ─────────────────────────────
test('El campo "Resultado Neto" está presente', content.includes('Resultado Neto'));

// ── Test 4: La variable netoPuntos está calculada ────────────────────────
test('Se declara la variable "netoPuntos" en JavaScript', content.includes('netoPuntos'));

// ── Test 5: El total de columnas del resumen es de 3 (col-4) ─────────────
// Con 3 columnas iguales se usa col-4 en lugar de col-6
const bloqueResumen = content.substring(
    content.indexOf('Puntos a Favor') - 200,
    content.indexOf('Puntos en Contra') + 300
);
test('Las columnas del resumen son col-4 (3 columnas iguales)', bloqueResumen.includes('col-4'));

// ── Resumen final ────────────────────────────────────────────────────────
console.log(`\n📊 Resultado: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
    process.exit(1);
} else {
    console.log('✅ Todos los tests pasaron.\n');
}
