/**
 * @file tests/portalScoreDetallado.test.js
 * @description Test TDD para validar que la vista del Portal de Clientes
 *              contenga los nuevos campos detallados del score (comportamiento de pago,
 *              reincidencia de mora) y sus botones de auditoría/información.
 * @run node tests/portalScoreDetallado.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function testPortalScoreDetallado() {
    console.log('🧪 Iniciando prueba TDD para verificar el desglose de score detallado en el Portal del Cliente...');

    const relPath = '../views/portal-cliente/dashboard.ejs';
    const fullPath = path.join(__dirname, relPath);
    
    assert.ok(fs.existsSync(fullPath), `El archivo ${path.basename(relPath)} debe existir`);

    const content = fs.readFileSync(fullPath, 'utf8');

    // 1. Verificar presencia de los IDs de los nuevos campos de desglose
    assert.ok(content.includes('id="desgloseComportamiento"'), 'Debe incluir el elemento del DOM desgloseComportamiento');
    assert.ok(content.includes('id="desgloseReincidencia"'), 'Debe incluir el elemento del DOM desgloseReincidencia');

    // 2. Verificar presencia de botones de auditoría en la vista del cliente
    assert.ok(content.includes('onclick="auditarComportamientoPago()"'), 'Debe incluir botón/link para auditar comportamiento de pago');
    assert.ok(content.includes('onclick="auditarPagadosATiempo()"'), 'Debe incluir botón/link para auditar préstamos pagados a tiempo');
    assert.ok(content.includes('onclick="auditarCuotasVencidas()"'), 'Debe incluir botón/link para auditar cuotas vencidas');

    // 3. Verificar presencia de explicaciones de reglas
    assert.ok(content.includes('onclick="explicarRegla('), 'Debe incluir la posibilidad de explicar reglas');

    // 4. Verificar que el script JS asigne la variable de auditoría y actualice los campos
    assert.ok(content.includes('window.scoreDataAuditoria'), 'Debe asignar la variable scoreDataAuditoria en el script');
    assert.ok(content.includes("document.getElementById('desgloseComportamiento')"), 'El script de recalcular debe actualizar desgloseComportamiento');
    assert.ok(content.includes("document.getElementById('desgloseReincidencia')"), 'El script de recalcular debe actualizar desgloseReincidencia');

    // 5. Verificar que no haya escapes incorrectos de comillas invertidas (\`) ni de interpolaciones (\${) que rompan el JS en el navegador
    const tieneComillasEscapadas = content.includes('\\`');
    const tieneInterpolacionesEscapadas = content.includes('\\${');
    assert.ok(!tieneComillasEscapadas, 'No deben haber comillas invertidas escapadas (\\`) en el script de dashboard.ejs');
    assert.ok(!tieneInterpolacionesEscapadas, 'No deben haber interpolaciones de variables escapadas (\\${) en el script de dashboard.ejs');

    console.log('✅ PASS: La vista del portal del cliente contiene todos los nuevos campos y funciones de auditoría del score crediticio.');
}

try {
    testPortalScoreDetallado();
} catch (error) {
    console.error('❌ FAIL:', error.message);
    process.exit(1);
}
